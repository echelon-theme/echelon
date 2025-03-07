// ==UserScript==
// @name			Echelon :: Australis Panel
// @description 	Adds back Australis panel functionality.
// @author			ephemeralViolette
// @include			main
// ==/UserScript==

var g_echelonAustralisPanel;

{

var { PrefUtils, BrandUtils, renderElement, waitForElement } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
renderElement = renderElement.bind(window);
waitForElement = waitForElement.bind(window);

ChromeUtils.defineESModuleGetters(window, {
    EchelonDragPositionManager: "chrome://userscripts/content/modules/EchelonDragPositionManager.sys.mjs",
    EchelonDebugTools: "chrome://userscripts/content/modules/EchelonDebugTools.sys.mjs",
    EchelonUpdateChecker: "chrome://userscripts/content/modules/EchelonUpdateChecker.sys.mjs",
    DragPositionManager: "resource:///modules/DragPositionManager.sys.mjs"
});
const Debug = EchelonDebugTools.getDebugController("AustralisPanel");
const CMDebug = EchelonDebugTools.getDebugController("AustralisPanel.CustomizeMode");

const OriginalDragPositionManager = window.DragPositionManager;

let strings = Services.strings.createBundle("chrome://echelon/locale/properties/australis-panel.properties");

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

const DEFAULT_PANEL_LAYOUT = [
    "edit-controls",
    "zoom-controls",
    "new-window-button",
    "privatebrowsing-button",
    "save-page-button",
    "print-button",
    "history-panelmenu",
    "fullscreen-button",
    "find-button",
    "preferences-button",
    "echelon-button",
    "add-ons-button",
    "developer-button"
];

function getScrollbarWidth()
{
    var inner = document.createElement('p');
    inner.style.width = "100%";
    inner.style.height = "200px";

    var outer = document.createElement('div');
    outer.style.position = "absolute";
    outer.style.top = "0px";
    outer.style.left = "0px";
    outer.style.visibility = "hidden";
    outer.style.width = "200px";
    outer.style.height = "150px";
    outer.style.overflow = "hidden";
    outer.appendChild(inner);

    document.body.appendChild(outer);
    var w1 = inner.offsetWidth;
    outer.style.overflow = 'scroll';
    var w2 = inner.offsetWidth;
    if (w1 == w2) w2 = outer.clientWidth;

    document.body.removeChild(outer);

    return (w1 - w2);
}

class AustralisPanelController
{
    ID_MENU_BUTTON = "PanelUI-menu-button";

    /**
     * The CustomizableUI area name for the PanelUI contents.
     *
     * This is what's used in the browser.uiCustomization.state dictionary.
     */
    CUI_AREA_PANEL = "PanelUI-contents";

    /**
     * A map of native widgets which we must redirect to a custom subview panel.
     */
    BUILTIN_SUBVIEW_MAP = {
        "history-panelmenu": {
            target: "PanelUI-history",
            onViewShowing: this.onHistoryViewShowing
        },
        "developer-button": {
            target: "PanelUI-developer",
            onViewShowing: this.onDeveloperViewShowing
        },
        "PanelUI-help": {
            target: "PanelUI-helpView",
            onViewShowing: this.onHelpViewShowing
        }
    };

    WIDE_PANEL_CLASS = "panel-wide-item";

    PANEL_COLUMN_COUNT = 3;

    panel = null;
    multiView = null;
    contents = null;
    mainView = null;
    menuButton = null;
    inCustomizeMode = false;

    syncEnabled = false;

    // The shadowed element map uses the builtin widgets map as a base, then things can be
    // dynamically added later if needed.
    shadowedElementMap = this.BUILTIN_SUBVIEW_MAP;

    init()
    {
        let panel = this.renderPanel();
        let popupset = document.getElementById("mainPopupSet");
        popupset.appendChild(panel);
        this.panel = panel;
        this.multiView = this.panel.querySelector("#PanelUI-multiView");
        this.contents = this.panel.querySelector("#PanelUI-contents");
        this.mainView = this.panel.querySelector("#PanelUI-mainView");
        this.refreshThemeDependentDisplayProperties();

        this.shadowManager.init();

        let menuButton = document.getElementById(this.ID_MENU_BUTTON);
        menuButton.addEventListener("click", this);
        menuButton.addEventListener("mousedown", this);
        this.menuButton = menuButton;

        this.customizeModeManager.setupCustomizeModeContainer();
        this.setupPanelCustomizationArea();

        this.mainView.addEventListener(
            "command",
            this.onMainViewCommand.bind(this)
        );

        this.subViewManager.init();

        window.addEventListener(
            "customizationstarting",
            this.customizeModeManager
        );
        window.addEventListener(
            "aftercustomization",
            this.customizeModeManager
        );

        if (PrefUtils.tryGetBoolPref("identity.fxaccounts.enabled", false) == true)
        {
            this.initFxaObservers();

            this.panel.addEventListener(
                "popupshowing",
                this.refreshFxaState.bind(this)
            );
        }
        else
        {
            let syncContainer = this.mainView.querySelector("#PanelUI-fxa-container");
            syncContainer.style.display = "none";
        }

        this.echelonUpdates();
    }

    renderPanel()
    {
        let elm = renderElement;

        return elm("xul:panel", {
            "id": "PanelUI-popup",
            "class": "australis-appmenu-panel panel-no-padding",
            "role": "group",
            "type": "arrow",
            "flip": "slide",
            "position": "bottomright topright",
            "noautofocus": "true"
        }, [
            elm("div",{
                "id": "PanelUI-multiView",
                "mainViewId": "PanelUI-mainView",
                "viewtype": "main"
            }, [
                elm("xul:panelview", {
                    "id": "PanelUI-mainView",
                    "context": "customizationPanelContextMenu",
                    "descriptionheightworkaround": "true",
                    "blockinboxworkaround": "true",
                    "visible": "true"
                }, [
                    elm("xul:vbox", { "id": "PanelUI-contents-scroller" }, [
                        elm("html:div", {
                            "class": "shadow-container",
                            "style": "display:none"
                        }),
                        elm("xul:vbox", {
                            "id": "PanelUI-contents",
                            "class": "panelUI-grid"
                        })
                    ]),

                    elm("xul:footer", { "id": "PanelUI-footer" }, [
                        elm("xul:vbox", { "id": "PanelUI-footer-addons" }),
                        elm("xul:toolbarbutton", {
                            "class": "panel-banner-item echelon-updates",
                            "label": str("echelon_update_available_label"),
                            "hidden": "true"
                        }),
                        elm("xul:hbox", { "id": "PanelUI-fxa-container" }, [
                            elm("xul:hbox", {
                                "id": "PanelUI-fxa-status",
                                "label": str("fxa_signed_in_tooltip"),
                                "defaultlabel": str("fxa_sign_in_label"),
                                "signedinTooltiptext": str("fxa_signed_in_tooltip"),
                                "tooltiptext": str("fxa_signed_in_tooltip"),
                                "errorlabel": str("fxa_sign_in_error_label"),
                                "unverifiedlabel": str("fxa_unverified_label"),
                                // this function is unimplemented now:
                                "onclick": "if (event.which == 1) g_echelonAustralisPanel.onSyncCommand()"
                            }, [
                                elm("xul:image", { "id": "PanelUI-fxa-avatar" }),
                                elm("xul:toolbarbutton", {
                                    "id": "PanelUI-fxa-label",
                                    "label": str("fxa_sign_in_label"),
                                    "fxabrandname": "Sync"
                                })
                            ]),
                            elm("xul:toolbarseparator"),
                            elm("xul:toolbarbutton", {
                                "id": "PanelUI-fxa-icon",
                                "oncommand": "gSync.doSync();",
                                "closemenu": "none"
                            }, [
                                // elm("xul:observes", {
                                //     "element": "sync-status",
                                //     "attribute": "syncstatus"
                                // }),
                                // elm("xul:observes", {
                                //     "element": "sync-status",
                                //     "attribute": "tooltiptext"
                                // })
                            ])
                        ]),

                        elm("xul:hbox", { "id": "PanelUI-footer-inner" }, [
                            elm("xul:toolbarbutton", {
                                "id": "PanelUI-customize",
                                "label": str("appmenu_customize.label"),
                                "tooltip": str("appmenu_customize.tooltip"),
                                "exitLabel": str("appmenu_customize.exit_label"),
                                "exitTooltiptext": str("appmenu_customize.exit_tooltip"),
                                "closemenu": "none",
                                "oncommand": "gCustomizeMode.toggle();"
                            }),
                            elm("xul:toolbarseparator"),
                            elm("xul:toolbarbutton", {
                                "id": "PanelUI-help",
                                "label": str("appmenu_help.label"),
                                "closemenu": "none",
                                "tooltiptext": str("appmenu_help.tooltip"),
                                // This was originally handled with a command, but here's
                                // a quick hack:
                                "echelon-subview-target": "true"
                            }),
                            elm("xul:toolbarseparator"),
                            elm("xul:toolbarbutton", {
                                "id": "PanelUI-quit",
                                "label": "&quitApplicationCmdWin2.label;",
                                "tooltiptext": str("appmenu_quit.tooltip", BrandUtils.getBrandingKey("brandShortName")),
                                "command": "cmd_quitApplication"
                            })
                        ])
                    ])
                ]),
                elm("xul:vbox", {
                    "class": "panel-clickcapturer"
                }),
                elm("xul:vbox", {
                    "class": "panel-subviews"
                }, [
                    elm("xul:panelview", {
                        id: "PanelUI-history",
                        class: "PanelUI-subView",
                        flex: "1"
                    }, [
                        elm("xul:label", {
                            "value": "History", // TODO: i18n
                            "class": "panel-subview-header"
                        }),
                        elm("xul:vbox", { "class": "panel-subview-body" }, [
                            elm("xul:toolbarbutton", {
                                "id": "appMenuViewHistorySidebar",
                                "label": str("appmenu_history.view_sidebar_label"),
                                "type": "checkbox",
                                "class": "subviewbutton",
                                "key": "key_gotoHistory",
                                "oncommand": "SidebarUI.toggle('viewHistorySidebar');g_echelonAustralisPanel.hide();"
                            }, [
                                elm("xul:observes", {
                                    "element": "viewHistorySidebar",
                                    "attribute": "checked"
                                })
                            ]),
                            elm("xul:toolbarbutton", {
                                "id": "appMenuClearRecentHistory",
                                "label": str("appmenu_history.clear_recent_label"),
                                "class": "subviewbutton",
                                "command": "Tools:Sanitize"
                            }),
                            elm("xul:toolbarbutton", {
                                "id": "appMenuRestoreLastSession",
                                "label": str("appmenu_history.restore_session_label"),
                                "class": "subviewbutton",
                                "command": "Browser:RestoreLastSession"
                            }),
                            elm("xul:menuseparator", {
                                "id": "PanelUI-recentlyClosedTabs-separator"
                            }),
                            elm("xul:vbox", {
                                "id": "PanelUI-recentlyClosedTabs",
                                "tooltip": "bhTooltip"
                            }),
                            elm("xul:menuseparator", {
                                "id": "PanelUI-recentlyClosedWindows-separator"
                            }),
                            elm("xul:vbox", {
                                "id": "PanelUI-recentlyClosedWindows",
                                "tooltip": "bhTooltip"
                            }),
                            elm("xul:menuseparator", {
                                "id": "PanelUI-historyItems-separator"
                            }),
                            elm("xul:vbox", {
                                "id": "PanelUI-historyItems",
                                "tooltip": "bhTooltip"
                            }),
                        ]),
                        elm("xul:toolbarbutton", {
                            "id": "PanelUI-historyMore",
                            "class": "panel-subview-footer subviewbutton",
                            "label": str("appmenu_history.show_all_label"),
                            "oncommand": "PlacesCommandHook.showPlacesOrganizer('History'); CustomizableUI.hidePanelForNode(this);"
                        })
                    ]),
                    elm("xul:panelview", {
                        "id": "PanelUI-developer",
                        "class": "PanelUI-subView",
                        "flex": "1"
                    }, [
                        elm("xul:label", {
                            "value": "Web Developer", // TODO: i18n
                            "class": "panel-subview-header"
                        }),
                        elm("xul:vbox", {
                            "id": "PanelUI-developerItems",
                            "class": "panel-subview-body"
                        })
                    ]),
                    elm("xul:panelview", {
                        "id": "PanelUI-helpView",
                        "class": "PanelUI-subView",
                        "flex": "1"
                    }, [
                        elm("xul:label", {
                            "value": "Help",
                            "class": "panel-subview-header"
                        }),
                        elm("xul:vbox", {
                            "id": "PanelUI-helpItems",
                            "class": "panel-subview-body"
                        })
                    ])
                ])
            ])
        ]);
    }

    async echelonUpdates() 
    {
        if (await EchelonUpdateChecker.checkForUpdate()) {
            this.mainView.querySelector(".echelon-updates").removeAttribute("hidden")
        }
    }

    /**
     * Sets up the panel's CustomizableUI area.
     */
    async setupPanelCustomizationArea()
    {
        await new Promise(resolve => {
            let delayedStartupObserver = (aSubject, aTopic, aData) => {
                if (aSubject == window) {
                    Services.obs.removeObserver(delayedStartupObserver, "browser-delayed-startup-finished");
                    resolve();
                }
            };
            Services.obs.addObserver(delayedStartupObserver, "browser-delayed-startup-finished");
        });

        let props = {
            type: CustomizableUI.TYPE_PANEL
        };
        CustomizableUI.registerArea(this.CUI_AREA_PANEL, props);

        let panelNode = this.contents;

        CustomizableUI.beginBatchUpdate();
        CustomizableUI.registerPanelNode(panelNode, this.CUI_AREA_PANEL);
        CustomizableUI.endBatchUpdate();

        if (!PrefUtils.tryGetBoolPref("Echelon.AustralisPanelUI.firstTimeDecorated", false))
        {
            this.applyDefaultLayout();
        }

        this.decorateWideItems();
        this.shadowManager.onInitialBuild();

        PanelUI.uninit();
    }

    applyDefaultLayout()
    {
        CustomizableUI.beginBatchUpdate();

        for (const widgetId of DEFAULT_PANEL_LAYOUT)
        {
            CustomizableUI.addWidgetToArea(widgetId, "PanelUI-contents");
        }

        CustomizableUI.endBatchUpdate(true);

        PrefUtils.trySetBoolPref("Echelon.AustralisPanelUI.firstTimeDecorated", true);
    }

    /**
     * Initialises Firefox accounts update observers.
     */
    initFxaObservers()
    {
        const handleUpdate = function()
        {
            this.refreshFxaState();
        }.bind(this);

        Services.obs.addObserver(handleUpdate, "sync-ui-state:update");
    }

    refreshFxaState()
    {
        let sync = window.gSync;

        // UIState is a global export in 115, but this might change in the future
        // if Mozilla devs decide to become sane (probably not).
        // If so, import from: resources://services-sync/UIState.sys.mjs
        let state = UIState.get();

        let syncContainer = this.multiView.querySelector("#PanelUI-fxa-container");
        let syncStatusEl = syncContainer.querySelector("#PanelUI-fxa-status");
        let syncLabelEl = syncContainer.querySelector("#PanelUI-fxa-label");
        let syncAvatarEl = syncContainer.querySelector("#PanelUI-fxa-avatar");

        const status = state.status;

        let defaultLabel = syncStatusEl.getAttribute("defaultlabel");
        let defaultTooltiptext = syncStatusEl.getAttribute("signedinTooltiptext");

        // Reset the status bar to its original state.
        syncContainer.removeAttribute("fxastatus");
        syncLabelEl.setAttribute("label", defaultLabel);
        syncStatusEl.setAttribute("tooltiptext", defaultTooltiptext);
        syncAvatarEl.style.removeProperty("list-style-image");

        if (status == UIState.STATUS_NOT_CONFIGURED)
        {
            return;
        }

        // At this point, sync is considered to be configured, but can still
        // be in an error state:
        if (status == UIState.STATUS_LOGIN_FAILED)
        {
            let errorLabel = syncStatusEl.getAttribute("errorlabel");
            syncContainer.setAttribute("fxastatus", "login-failed");
            syncLabelEl.setAttribute("label", errorLabel);
            
            // There's a formatted tooltip in the original implementation, but
            // this string isn't supported yet. If you want to reimplement it,
            // look at browser-sync.js in old Firefox.

            return;
        }
        else if (status == UIState.STATUS_NOT_VERIFIED)
        {
            let unverifiedLabel = syncStatusEl.getAttribute("unverifiedlabel");
            syncContainer.setAttribute("fxastatus", "unverified");
            syncLabelEl.setAttribute("label", unverifiedLabel);

            return;
        }

        // If the above checks succeeded, then we assume we're logged in.
        syncContainer.setAttribute("fxastatus", "signedin");
        syncLabelEl.setAttribute("label", state.displayName || state.email);

        if (state.avatarURL)
        {
            let bgImage = `url(${state.avatarURL})`;
            syncAvatarEl.style.listStyleImage = bgImage;

            let img = new Image();
            img.onerror = () => {
                // Clear the image if it has trouble loading.
                // Since this callback is asynchronous, we check to make sure that
                // the original image is still the same before we clear it.
                if (syncAvatarEl.style.listStyleImage == bgImage)
                {
                    syncAvatarEl.style.removeProperty("list-style-image");
                }
            };
            img.src = state.avatarURL;
        }
    }

    onSyncCommand()
    {
        let syncContainer = this.multiView.querySelector("#PanelUI-fxa-container");

        switch (syncContainer.getAttribute("fxastatus"))
        {
            case "signedin":
                gSync.openPrefs("menupanel", "fxaSignedin");
                break;
            case "error":
                gSync.openSignInAgainPage("menupanel");
                break;
            default:
                gSync.openPrefs("menupanel", "fxa");
                break;
        }

        this.hide();
    }

    /**
     * Refreshes theme-dependent display properties, such as the width of the
     * scrollbar.
     */
    refreshThemeDependentDisplayProperties()
    {
        let scrollbarWidth = getScrollbarWidth();
        let scroller = this.mainView.querySelector("#PanelUI-contents-scroller");

        if (scroller)
        {
            scroller.style.setProperty("--scrollbar-width", String(scrollbarWidth) + "px");
        }
    }

    decorateWideItems()
    {
        const items = [
            document.querySelector("toolbaritem#edit-controls"),
            document.querySelector("toolbaritem#zoom-controls"),
            document.querySelector("toolbaritem#search-container")
        ];

        for (const elm of items)
        {
            if (elm && !elm.classList.contains(this.WIDE_PANEL_CLASS))
            {
                elm.classList.add(this.WIDE_PANEL_CLASS);
            }
        }
    }

    handleEvent(e)
    {
        if (
            e.type.startsWith("popup") &&
            e.target != this.panel
        )
        {
            return;
        }

        switch (e.type)
        {
            case "mousedown":
                if (e.button == 0)
                    this.toggle(e);
                break;
            case "keypress":
                this.toggle(e);
                break;
        }
    }

    toggle(aEvent)
    {
        // Don't show the panel if the window is in customization mode,
        // since this button doubles as an exit path for the user in this case.
        if (document.documentElement.hasAttribute("customizing"))
        {
            return;
        }

        if (this.panel.state == "open")
        {
            this.hide();
        }
        else if (this.panel.state == "closed")
        {
            this.show(aEvent);
        }
    }

    show(aEvent)
    {
        if (this.panel.state == "open" ||
            document.documentElement.hasAttribute("customizing")) {
            resolve();
            return;
        }

        let anchor;
        let domEvent = null;
        if (
            !aEvent ||
            aEvent.type == "command"
        )
        {
            anchor = this.menuButton;
        }
        else
        {
            domEvent = aEvent;
            anchor = aEvent.target;
        }

        anchor = this._getPanelAnchor(anchor);
        this.panel.openPopup(anchor, { triggerEvent: domEvent });
    }

    hide()
    {
        if (document.documentElement.hasAttribute("customizing"))
        {
            return;
        }

        this.panel.hidePopup();
    }

    _getPanelAnchor(candidate)
    {
        let iconAnchor = candidate.badgeStack || candidate.icon;
        return iconAnchor || candidate;
    }

    //-----------------------------------------------------------------------------------
    // Subview handlers:
    //

    onMainViewCommand(event)
    {
        if (
            event.target.getAttribute("echelon-panel-shadowed") == "true" ||
            event.target.getAttribute("echelon-subview-target") == "true"
        )
        {
            let info = this.BUILTIN_SUBVIEW_MAP[event.target.id];
            let targetId = "";

            if (typeof info == "object")
            {
                targetId = info.target;

                if (!event.target.__echelonShadowDecoratedEvents)
                {
                    let targetView = this.panel.querySelector("#" + targetId);

                    if (info.onViewShowing)
                    {
                        targetView.addEventListener("ViewShowing", info.onViewShowing.bind(this));
                    }
                    event.target.__echelonShadowDecoratedEvents = true;
                }
            }
            else if (typeof info == "string")
            {
                targetId = info;
            }

            this.subViewManager.showSubView(targetId, event.target);
        }
    }

    onHistoryViewShowing(event)
    {
        // Populate our list of history
        const MAX_RESULTS = 15;
        let doc = event.target.ownerDocument;
        let win = doc.defaultView;

        let options = PlacesUtils.history.getNewQueryOptions();
        options.excludeQueries = true;
        options.queryType = options.QUERY_TYPE_HISTORY;
        options.sortingMode = options.SORT_BY_DATE_DESCENDING;
        options.maxResults = MAX_RESULTS;
        let query = PlacesUtils.history.getNewQuery();

        let items = doc.getElementById("PanelUI-historyItems");
        // Clear previous history items:
        while (items.firstChild)
        {
            items.firstChild.remove();
        }

        // Get all statically placed buttons to supply them with keyboard shortcuts.
        let staticButtons = items.parentNode.querySelectorAll("toolbarbutton");
        for (let i = 0, l = staticButtons.length; i < l; ++i)
            CustomizableUI.addShortcut(staticButtons[i]);

        PlacesUtils.history.asyncExecuteLegacyQuery(query, options, {
            handleResult(aResultSet)
            {
                let onItemCommand = function(aItemCommandEvent)
                {
                    // Only handle the click event for middle clicks; we're using the
                    // command event otherwise.
                    if (aItemCommandEvent.type == "click" && aItemCommandEvent.button != 1)
                    {
                        return;
                    }

                    let item = aItemCommandEvent.target;
                    win.openUILink(item.getAttribute("targetURI"), aItemCommandEvent, {
                        triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({})
                    });
                    CustomizableUI.hidePanelForNode(item);
                };

                let fragment = doc.createDocumentFragment();
                let row;

                while ((row = aResultSet.getNextRow()))
                {
                    let uri = row.getResultByIndex(1);
                    let title = row.getResultByIndex(2);

                    let item = renderElement("xul:toolbarbutton");
                    item.setAttribute("label", title || uri);
                    item.setAttribute("targetURI", uri);
                    item.setAttribute("class", "subviewbutton");
                    item.addEventListener("command", onItemCommand);
                    item.addEventListener("click", onItemCommand);
                    item.setAttribute("image", "page-icon:" + uri);
                    fragment.appendChild(item);
                }

                items.appendChild(fragment);
            },

            handleError(aError)
            {
                Debug.log("[bookmarks menu] build error: " + aError);
            },

            handleCompletion(aReason) {}
        });

        let recentlyClosedTabs = doc.getElementById("PanelUI-recentlyClosedTabs");
        while (recentlyClosedTabs.firstChild)
        {
            recentlyClosedTabs.firstChild.remove();
        }

        let recentlyClosedWindows = doc.getElementById("PanelUI-recentlyClosedWindows");
        while (recentlyClosedWindows.firstChild)
        {
            recentlyClosedWindows.firstChild.remove();
        }

        let utils = RecentlyClosedTabsAndWindowsMenuUtils;
        let tabsFragment = utils.getTabsFragment(
            doc.defaultView,
            "toolbarbutton",
            true,
            "menuRestoreAllTabsSubview.label"
        );
        let separator = doc.getElementById("PanelUI-recentlyClosedTabs-separator");
        let elementCount = tabsFragment.childElementCount;
        separator.hidden = !elementCount;
        while (--elementCount >= 0)
        {
            let element = tabsFragment.children[elementCount];
            CustomizableUI.addShortcut(element);
            element.classList.add("subviewbutton", "cui-withicon");
        }
        recentlyClosedTabs.appendChild(tabsFragment);

        let windowsFragment = utils.getWindowsFragment(
            doc.defaultView,
            "toolbarbutton",
            true,
            "menuRestoreAllWindowsSubview.label"
        );
        separator = doc.getElementById("PanelUI-recentlyClosedWindows-separator");
        elementCount = windowsFragment.childElementCount;
        separator.hidden = !elementCount;
        while (--elementCount >= 0)
        {
            let element = windowsFragment.children[elementCount];
            CustomizableUI.addShortcut(element);
            element.classList.add("subviewbutton", "cui-withicon");
        }

        recentlyClosedWindows.appendChild(windowsFragment);
    }

    onDeveloperViewShowing(event)
    {
        // Populate the subview with whatever menuitems are in the developer
        // menu. We skip menu elements, because the menu panel has no way of
        // dealing with those.
        let doc = event.target.ownerDocument;
        let menu = doc.getElementById("menuWebDeveloperPopup");

        let itemsToDisplay = Array.from(menu.children);

        // Hardcode the addition of the "work offline" menuitem at the bottom:
        itemsToDisplay.push({
            localName: "menuseparator",
            getAttribute: () => {}
        });
        itemsToDisplay.push(doc.getElementById("goOfflineMenuitem"));

        let developerItems = doc.getElementById("PanelUI-developerItems");

        this.clearSubview(developerItems);
        this.fillSubviewFromMenuItems(itemsToDisplay, developerItems);
    }

    onHelpViewShowing(event)
    {
        // Call global menu setup function
        buildHelpMenu();
        
        let helpMenu = document.getElementById("menu_HelpPopup");
        let helpView = document.getElementById("PanelUI-helpView");
        let items = helpView.querySelector("vbox");
        let attrs = [
            "oncommand", "onclick", "label", "key", "disabled"
        ];

        // Remove all buttons from the view
        while (items.firstChild)
        {
            items.firstChild.remove();
        }

        // Add the current set of menuitems of the Help menu to this view
        let menuItems = Array.prototype.slice.call(
            Array.from(helpMenu.querySelectorAll("menuitem"))
        );
        let fragment = document.createDocumentFragment();

        for (const node of menuItems)
        {
            if (node.hidden)
                continue;

            let button = renderElement("xul:toolbarbutton");

            // Copy specific attributes from a menuitem of the Help menu
            for (const attrName of attrs)
            {
                if (!node.hasAttribute(attrName))
                    continue;

                button.setAttribute(attrName, node.getAttribute(attrName));
            }

            button.setAttribute("class", "subviewbutton");
            fragment.appendChild(button);
        }

        items.appendChild(fragment);
    }

    fillSubviewFromMenuItems(menuItems, subview)
    {
        let attrs = [
            "oncommand", "onclick", "label", "key", "disabled",
            "command", "observes", "hidden", "class", "origin",
            "image", "checked", "style"
        ];

        let doc = subview.ownerDocument;
        let fragment = doc.createDocumentFragment();

        for (const menuChild of menuItems)
        {
            if (menuChild.hidden)
                continue;

            let subviewItem;
            if (menuChild.localName == "menuseparator")
            {
                // Don't insert duplicate or leading separators. This can happen if
                // there are menus (which we don't copy) above the separator.
                if (
                    !fragment.lastChild ||
                    fragment.lastChild.localName == "menuseparator"
                )
                {
                    continue;
                }

                subviewItem = renderElement("xul:menuseparator");
            }
            else if (menuChild.localName == "menuitem")
            {
                subviewItem = renderElement("xul:toolbarbutton");
                CustomizableUI.addShortcut(menuChild, subviewItem);

                let item = menuChild;
                if (!item.hasAttribute("onclick"))
                {
                    subviewItem.addEventListener("onclick", event => {
                        let newEvent = new doc.defaultView.MouseEvent(event.type, event);
                        item.dispatchEvent(newEvent);
                    });
                }

                if (!item.hasAttribute("oncommand"))
                {
                    subviewItem.addEventListener("command", event => {
                        let newEvent = doc.createEvent("XULCommandEvent");
                        newEvent.initCommandEvent(
                            event.type, event.bubbles, event.cancelable, event.view,
                            event.detail, event.ctrlKey, event.altKey, event.shiftKey,
                            event.metaKey, event.sourceEvent, null
                        );
                        item.dispatchEvent(newEvent);
                    });
                }
            }
            else
            {
                continue;
            }

            for (let attr of attrs)
            {
                let attrVal = menuChild.getAttribute(attr);

                if (attrVal)
                    subviewItem.setAttribute(attr, attrVal);
            }

            // We do this after so the .subviewbutton class doesn't get overridden:
            if (menuChild.localName == "menuitem")
            {
                subviewItem.classList.add("subviewbutton");
            } 

            fragment.appendChild(subviewItem);
        }

        subview.appendChild(fragment);
    }

    clearSubview(subview)
    {
        let parent = subview.parentNode;

        // We'll take the container out of the document before cleaning it out
        // to avoid reflowing each time we remove something.
        parent.removeChild(subview);

        while (subview.firstChild)
        {
            subview.firstChild.remove();
        }

        parent.appendChild(subview);
    }

    subViewManager = new (class
    {

        parent = null;

        anchorElement = null;
        _currentSubView = null;
        _viewShowing = false;
        _mainViewHeight = null;
        _mainViewObserver = null;
        _subViewObserver = null;
        _currentSubView = null;
        
        _panelViews = null;

        __transitioning = false;

        get _clickCapturer()
        {
            return this.node.querySelector(".panel-clickcapturer");
        }

        get showingSubView()
        {
            return this._viewStack.getAttribute("viewtype") == "subview";
        }

        get _transitioning()
        {
            return this.__transitioning;
        }

        set _transitioning(val)
        {
            this.__transitioning = val;

            if (val)
            {
                this.node.setAttribute("transitioning", "true");
            }
            else
            {
                this.node.removeAttribute("transitioning");
            }
        }

        _ignoreMutations = false;

        get ignoreMutations()
        {
            return this._ignoreMutations;
        }

        set ignoreMutations(val)
        {
            this._ignoreMutations = val;

            if (!val && this._panel.state == "open")
            {
                if (this.showingSubView)
                {
                    this._syncContainerWithSubView();
                }
                else
                {
                    this._syncContainerWithMainView();
                }
            }
        }

        get _panel() { return this.parent.panel; }
        get _mainViewContainer() { return this.parent.panel.querySelector("#PanelUI-contents-scroller"); }
        get _mainView() { return this.parent.mainView; }
        get node() { return this.parent.multiView; }
        get _subViews() { return this.parent.multiView.querySelector(".panel-subviews"); }

        // In Echelon's implementation, the DOM structure of the multiview element was flattened,
        // so these are no longer handled as separate elements.
        get _viewContainer() { return this.parent.multiView; }
        get _viewStack() { return this.parent.multiView; }

        constructor(parent)
        {
            this.parent = parent;

            this._subViewObserver = new MutationObserver(
                this._syncContainerWithSubView.bind(this)
            );

            this._mainViewObserver = new MutationObserver(
                this._syncContainerWithMainView.bind(this)
            );
        }

        destructor()
        {
            this._mainViewObserver.disconnect();
            this._subViewObserver.disconnect();

            this._panel.removeEventListener("popupshowing", this);
            this._panel.removeEventListener("popupshown", this);
            this._panel.removeEventListener("popuphidden", this);
            this._subViews.removeEventListener("overflow", this);
            this._mainViewContainer.removeEventListener("overflow", this);
            this._clickCapturer.removeEventListener("click", this);
        }

        init()
        {
            this._panel.addEventListener("popupshowing", this);
            this._panel.addEventListener("popupshown", this);
            this._panel.addEventListener("popuphidden", this);
            this._subViews.addEventListener("overflow", this);
            this._mainViewContainer.addEventListener("overflow", this);
            this._clickCapturer.addEventListener("click", this);
        }

        showMainView()
        {
            if (this.showingSubView)
            {
                let viewNode = this._currentSubView;
                let evt = new CustomEvent("ViewHiding", {
                    bubbles: true,
                    cancelable: true
                });
                viewNode.dispatchEvent(evt);

                viewNode.removeAttribute("current");
                this._currentSubView = null;

                this._subViewObserver.disconnect();

                this._setViewContainerHeight(this._mainViewHeight);

                this.node.setAttribute("viewtype", "main");
            }
            
            this._shiftMainView(null);
        }

        async showSubView(viewId, anchor)
        {
            let viewNode = typeof viewId == "string"
                ? this._viewContainer.querySelector("#" + viewId)
                : viewId;

            if (!viewNode)
            {
                viewNode = document.getElementById(viewId);

                if (viewNode)
                {
                    this._subViews.appendChild(viewNode);
                }
                else
                {
                    throw new Error(`Subview ${viewId} doesn't exist!`);
                }
            }

            this._mainViewHeight = this._viewStack.clientHeight;
            this._subViews.style.minHeight = this._mainViewHeight + "px";
            
            viewNode.setAttribute("current", true);

            // Emit the ViewShowing event so that the widget definition has a chance to
            // lazily populate the subview with things.
            let detail = {
                blockers: new Set(),
                addBlocker(aPromise)
                {
                    this.blockers.add(aPromise);
                }
            };

            let evt = new CustomEvent("ViewShowing");
            viewNode.dispatchEvent(evt);

            let cancel = evt.defaultPrevented;
            if (detail.blockers.size)
            {
                try
                {
                    let results = await Promise.all(details.blockers);
                    cancel = cancel || results.some(val => val == false);
                }
                catch (e)
                {
                    cancel = true;
                }
            }

            if (cancel)
                return;

            this._currentSubView = viewNode;

            // Now we have to transition the panel. There are a few parts to this:
            //
            // 1) The main view content gets shifted so that the center of the anchor
            //    node is at the left-most edge of the panel.
            // 2) The subview deck slides in so that it takes up almost all of the
            //    panel.
            // 3) If the subview is taller then the main panel contents, then the panel
            //    must grow to meet that new height. Otherwise, it must shrink.
            //
            // All three of these actions make use of CSS transformations, so they
            // should all occur simultaneously.
            this.node.setAttribute("viewtype", "subview");
            this._shiftMainView(anchor);

            let newHeight = this._heightOfSubview(viewNode, this._subViews);
            this._setViewContainerHeight(newHeight);

            this._subViewObserver.observe(viewNode, {
                attributes: true,
                characterData: true,
                childList: true,
                subtree: true
            });
        }

        _setViewContainerHeight(height)
        {
            let viewNode = this._currentSubView;

            if (this._panel.getAttribute("panelopen") == "true")
            {
                let container = this._viewContainer;
                this._transitioning = true;

                if (viewNode)
                    viewNode.setAttribute("transitioning", "true");

                let onTransitionEnd = () => {
                    container.removeEventListener("transitionend", onTransitionEnd);
                    this._transitioning = false;

                    if (viewNode)
                        viewNode.removeAttribute("transitioning");
                };

                container.addEventListener("transitionend", onTransitionEnd);
                container.style.height = `${height}px`;
            }
        }

        _shiftMainView(anchor = null)
        {
            if (anchor)
            {
                let anchorRect = anchor.getBoundingClientRect();
                let mainViewRect = this._mainView.getBoundingClientRect();
                let center = anchor.clientWidth / 2;
                let direction = anchor.ownerGlobal.getComputedStyle(anchor).direction;
                let edge;
                if (direction == "ltr")
                {
                    edge = anchorRect.left - mainViewRect.left;
                }
                else
                {
                    edge = mainViewRect.right - anchorRect.right;
                }

                // If the anchor is an element on the far end of the mainView, we
                // don't want to shift the mainView too far, as we would reveal
                // empty space otherwise.
                let cstyle = getComputedStyle(this._panel);
                let exitSubViewGutterWidth = cstyle.getPropertyValue("--panel-ui-exit-subview-gutter-width");
                let maxShift = mainViewRect.width - parseInt(exitSubViewGutterWidth);
                let target = Math.min(maxShift, edge + center);

                let neg = direction == "ltr" ? "-" : "";
                this._mainView.style.transform = `translateX(${neg}${target}px)`;
                anchor.setAttribute("panel-multiview-anchor", true);
            }
            else
            {
                this._mainView.style.transform = "";
                if (this.anchorElement)
                {
                    this.anchorElement.removeAttribute("panel-multiview-anchor");
                }
            }

            this.anchorElement = anchor;
        }

        handleEvent(event)
        {
            if (event.type.startsWith("popup") && event.target != this._panel)
            {
                // Shouldn't act on e.g. context menus being shown from within the panel.
                return;
            }

            switch (event.type)
            {
                case "click":
                    if (event.originalTarget == this._clickCapturer)
                    {
                        this.showMainView();
                    }
                    break;
                case "overflow":
                    if (event.target.localName == "vbox")
                    {
                        if (this.showingSubView)
                        {
                            setTimeout(this._syncContainerWithSubView.bind(this), 0);
                        }
                        else if (!this._transitioning)
                        {
                            setTimeout(this._syncContainerWithMainView.bind(this), 0);
                        }
                    }
                    else if (event.target.localName == "panel")
                    {
                        let cs = getComputedStyle(event.target);

                        if (cs.top.startsWith("-"))
                        {
                            // The panel is overflowing, so we must set some special
                            // display mode on it:
                            let baseHeight = this._panel.getBoundingClientRect().height;

                            this._subViews.style.maxHeight = this._viewContainer.style.maxHeight 
                                = `calc(${baseHeight}px - 16px)`;
                        }
                        else
                        {
                            this._subViews.style.removeProperty("max-height");
                            this._viewContainer.style.removeProperty("max-height");
                        }
                    }
                    break;
                case "popupshowing":
                    this.node.setAttribute("panelopen", "true");

                    this._panel.autoPosition = false;
                    this._syncContainerWithMainView();

                    this._mainViewObserver.observe(this._mainView, {
                        attributes: true,
                        characterData: true,
                        childList: true,
                        subtree: true
                    });

                    break;
                case "popupshown":
                    this._setMaxHeight();
                    break;
                
                case "popuphidden":
                    this.node.removeAttribute("panelopen");
                    this._mainView.style.removeProperty("height");
                    this._viewContainer.style.removeProperty("height");
                    this._viewContainer.removeAttribute("transitioning"); // just in case
                    this.showMainView();
                    this._mainViewObserver.disconnect();
                    break;
            }
        }

        _shouldSetHeight()
        {
            return this.node.getAttribute("nosubviews") != "true";
        }

        _setMaxHeight()
        {
            if (!this._shouldSetHeight())
                return;

            // Ignore the mutation that'll fire when we set the height of
            // the main view.
            this.ignoreMutations = true;
            let heightMax = Math.max(
                window.screen.height * (3/5), 
                document.documentElement.clientHeight + 30
            );
            this._viewContainer.style.maxHeight = `calc(${heightMax}px + 16px)`;
            this.ignoreMutations = false;
        }

        _adjustContainerHeight()
        {
            if (!this._ignoreMutations && !this.showingSubView && !this._transitioning)
            {
                let height;
                if (this.showingSubViewAsMainView)
                {
                    height = this._heightOfSubview(this._mainView);
                }
                else
                {
                    height = this._mainView.scrollHeight;
                }

                this._viewContainer.style.height = height + "px";
            }
        }

        _syncContainerWithSubView()
        {
            // Check that this panel is still alive:
            if (!this._panel || !this._panel.parentNode)
            {
                return;
            }

            if (!this._ignoreMutations && this.showingSubView)
            {
                let newHeight = this._heightOfSubview(this._currentSubView, this._subViews);
                this._viewContainer.style.height = newHeight + "px";
            }
        }

        _syncContainerWithMainView()
        {
            // Check that this panel is still alive:
            if (!this._panel || !this._panel.parentNode)
            {
                return;
            }

            // if (this._shouldSetPosition())
            // {
            //     this._panel.adjustArrowPosition();
            // }

            if (this._shouldSetHeight())
            {
                this._adjustContainerHeight();
            }
        }

        _heightOfSubview(subview, containerToCheck)
        {
            function getFullHeight(element)
            {
                // XXXgijs: unfortunately, scrollHeight rounds values, and there's no alternative
                // that works with overflow: auto elements. Fortunately for us,
                // we have exactly 1 (potentially) scrolling element in here (the subview body),
                // and rounding 1 value is OK - rounding more than 1 and adding them means we get
                // off-by-1 errors. Now we might be off by a subpixel, but we care less about that.
                // So, use scrollHeight *only* if the element is vertically scrollable.
                let height;
                let elementCS;
                
                if (element.scrollTopMax)
                {
                    height = element.scrollHeight;
                    // Bounding client rects include borders, scrollHeight doesn't:
                    elementCS = getComputedStyle(element);
                    height += parseFloat(elementCS.borderTopWidth) +
                              parseFloat(elementCS.borderBottomWidth);
                }
                else
                {
                    height = element.getBoundingClientRect().height;
                    
                    if (height > 0)
                    {
                        elementCS = getComputedStyle(element);
                    }
                }

                if (elementCS)
                {
                    // Include margins - but not borders or paddings because they
                    // were dealt with above.
                    height += parseFloat(elementCS.marginTop) +
                              parseFloat(elementCS.marginBottom);
                }

                return height;
            }

            let win = subview.ownerGlobal;
            let body = subview.querySelector(".panel-subview-body");
            let height = getFullHeight(body || subview);

            if (body)
            {
                let header = subview.querySelector(".panel-subview-header");
                let footer = subview.querySelector(".panel-subview-footer");

                height += (header ? getFullHeight(header) : 0) +
                          (footer ? getFullHeight(footer) : 0);
            }

            if (containerToCheck)
            {
                let containerCS = getComputedStyle(containerToCheck);

                height += parseFloat(containerCS.paddingTop) +
                          parseFloat(containerCS.paddingBottom);
            }

            return Math.ceil(height);
        }

    })(this);

    //-----------------------------------------------------------------------------------
    // Customize mode handlers:
    //

    customizeModeManager = new (class {

        parent = null;

        constructor(parent)
        {
            this.parent = parent;
            this.boundOnForeignDragStart = this.onForeignDragStart.bind(this);
            this.boundOnForeignDragDrop = this.onForeignDragDrop.bind(this);
            this.boundOnForeignDragEnd = this.onForeignDragEnd.bind(this);
            this.boundOnForeignDragOver = this.onForeignDragOver.bind(this);
        }

        get shadowManager() { return this.parent.shadowManager; }
        get mainView() { return this.parent.mainView; }
        get multiView() { return this.parent.multiView; }
        get contents() { return this.parent.contents; }
        get PANEL_COLUMN_COUNT() { return this.parent.PANEL_COLUMN_COUNT; }

        PLACEHOLDER_CLASS = "panel-customization-placeholder";

        DRAG_DATA_TYPE_PREFIX = "text/toolbarwrapper-id/";
        _initializeDragAfterMove = null;
        _dragInitializeTimeout = null;

        customizeModeContainer = null;

        boundOnForeignDragStart = null;
        boundOnForeignDragDrop = null;
        boundOnForeignDragEnd = null;
        boundOnForeignDragOver = null;

        /**
         * Sets up the customise mode container.
         *
         * There's basically a hack that we need to apply here. Since the customise
         * area is handled really differently since Photon, and because Mozilla's
         * own code for handling it is hacky, we need to work around some element
         * parent shit.
         */
        async setupCustomizeModeContainer()
        {
            let customizationContainer = await waitForElement("#customization-container");
            let footer = customizationContainer.querySelector("#customization-footer");
            let contentContainer = document.querySelector("#customization-content-container");
            let panelContainer = document.querySelector("#customization-panel-container");
            
            let customizationDensityPanel = await waitForElement("#customization-uidensity-menu");
            customizationDensityPanel.setAttribute("position", "topcenter bottomleft");

            let customizationDensityPanelHeader = MozXULElement.parseXULToFragment(
            `
                <label id="customization-uidensity-menu-header" />
            `);
            customizationDensityPanel.insertBefore(customizationDensityPanelHeader, customizationDensityPanel.firstChild); 
            
            const [density] = await document.l10n.formatMessages([
                { id: "customize-mode-uidensity" }
            ]); 
            const densityValue = density.attributes[0].value;
            customizationDensityPanel.querySelector("#customization-uidensity-menu-header").value = densityValue;

            customizationContainer.appendChild(panelContainer);

            panelContainer.querySelector("#customization-panelHolder").style.display = "none";
        }

        /**
         * The main event handler router.
         *
         * The event flow of customise mode is actually very weird, and there are a few
         * oddities which must be accounted for:
         *  - "dragstart" event is only triggered on the area the event starts in.
         *
         * @param {Event} event
         */
        handleEvent(event)
        {
            CMDebug.log(`Echelon panel event ${event.type}`, event);

            switch (event.type)
            {
                case "customizationstarting":
                    this.onEnterCustomizeMode();
                    break;
                case "aftercustomization":
                    this.onLeaveCustomizeMode();
                    break;
                case "dragstart":
                    this.onDragStart(event);
                    break;
                case "dragover":
                    this.onDragOver(event);
                    break;
                case "drop":
                    this.onDragDrop(event);
                    break;
                case "dragleave":
                    this.onDragLeave(event);
                    break;
                case "dragend":
                    this.onDragEnd(event);
                    break;
                default:
                    CMDebug.log("Unknown event.", event);
                    return;
            }
        }

        /**
         * Behaviours to run when the user enters customise mode.
         *
         * This performs initialisation tasks for UI customisation of the panel.
         */
        onEnterCustomizeMode()
        {
            this.shadowManager.setOriginalView();
            this.parent.subViewManager.ignoreMutations = true;

            // Hide the PanelUI popup when entering customize mode.
            let panelUIPoup = document.querySelector("#PanelUI-popup");
            panelUIPoup.hidePopup();

            // Move the main view over to the customisation container.
            let newContainer = document.querySelector("#customization-panelWrapper .panel-arrowcontent");
            newContainer.appendChild(this.mainView);
            this.mainView.classList.add("australis-appmenu-panel");

            // When we enter customize mode, events are registered by the Firefox backend on
            // the customization target (#PanelUI-contents). Because the panel is incompatible
            // with the official implementation, we want to replace some events with our own
            // implementations:
            let target = this.contents;
            let intervalId = setInterval(function()
            {
                target.removeEventListener("dragstart", gCustomizeMode, true);
                target.removeEventListener("dragover", gCustomizeMode, true);
                target.removeEventListener("drop", gCustomizeMode, true);
                target.removeEventListener("dragleave", gCustomizeMode, true);
                target.removeEventListener("dragend", gCustomizeMode, true);
            }, 1);
            setTimeout(function timeoutProc()
            {
                clearInterval(intervalId);
            }, 2500);

            target.addEventListener("dragstart", this, true);
            target.addEventListener("dragover", this, true);
            target.addEventListener("drop", this, true);
            target.addEventListener("dragleave", this, true);
            target.addEventListener("dragend", this, true);

            // Register foreign event listeners on all foreign areas.
            for (const elm of this.getForeignAreas())
            {
                elm.addEventListener("dragstart", this.boundOnForeignDragStart, true);
                elm.addEventListener("drop", this.boundOnForeignDragDrop, true);
                elm.addEventListener("dragend", this.boundOnForeignDragEnd, true);
                elm.addEventListener("dragover", this.boundOnForeignDragOver, true);
            }

            this.contents.setAttribute("customizing", "true");
            this._showPanelCustomizationPlaceholders();

            for (const elm of this.mainView.querySelectorAll("#PanelUI-footer toolbarbutton"))
            {
                elm.disabled = true;
            }

            let customizeButton = this.mainView.querySelector("#PanelUI-customize");
            customizeButton.disabled = false;
            customizeButton._previousLabel = customizeButton.label;
            customizeButton._previousTooltip = customizeButton.tooltip;
            customizeButton.label = customizeButton.getAttribute("exitLabel");
            customizeButton.tooltipText = customizeButton.getAttribute("exitTooltiptext");

            EchelonDragPositionManager.add(window, "PanelUI-contents", this.contents);

            let contentContainer = document.querySelector("#customization-content-container");
            contentContainer.querySelector("#customization-header").textContent = str("customizeMode.menuAndToolbars.header2");
        }

        /**
         * Behaviours to run when the user leaves customise mode.
         *
         * This undoes the changes made by the enter handler.
         */
        onLeaveCustomizeMode()
        {
            this.shadowManager.setShadowsView();
            this.parent.subViewManager.ignoreMutations = false;

            // Unregister foreign event listeners from all foreign areas.
            for (const elm of this.getForeignAreas())
            {
                elm.removeEventListener("dragstart", this.boundOnForeignDragStart, true);
                elm.removeEventListener("drop", this.boundOnForeignDragDrop, true);
                elm.removeEventListener("dragend", this.boundOnForeignDragEnd, true);
                elm.removeEventListener("dragover", this.boundOnForeignDragOver, true);
            }

            EchelonDragPositionManager.stop();

            let target = this.contents;
            target.removeEventListener("dragstart", this, true);
            target.removeEventListener("dragover", this, true);
            target.removeEventListener("drop", this, true);
            target.removeEventListener("dragleave", this, true);
            target.removeEventListener("dragend", this, true);

            // Move the main view back over to the original container.
            this.multiView.insertAdjacentElement("afterbegin", this.mainView);
            this.mainView.classList.remove("australis-appmenu-panel");

            this.contents.removeAttribute("customizing");
            this._removePanelCustomizationPlaceholders();

            for (const elm of this.mainView.querySelectorAll("#PanelUI-footer toolbarbutton"))
            {
                elm.disabled = false;
            }

            let customizeButton = this.mainView.querySelector("#PanelUI-customize");
            customizeButton.label = customizeButton._previousLabel;
            customizeButton.tooltipText = customizeButton._previousTooltip;
            delete customizeButton._previousLabel;

            EchelonDragPositionManager.remove(window, "PanelUI-contents", this.contents);
        }

        /**
         * Handles starting dragging in the custom area.
         *
         * @param {Event} event
         */
        onDragStart(event)
        {
            let item = event.target;
            while (item && item.localName != "toolbarpaletteitem")
            {
                if (
                    item.localName == "toolbar" ||
                    item.id == "customization-palette" ||
                    item.id == "customization-panel-container"
                )
                {
                    return;
                }
                item = item.parentNode;
            }

            if (item.classList.contains(this.PLACEHOLDER_CLASS))
            {
                return;
            }

            // The normal drag handler must be started in order for foreign area
            // dropping to work.
            gCustomizeMode._onDragStart(event);

            let draggedItem = item.firstElementChild;

            if (!this._initializeDragAfterMove)
            {
                this._initializeDragAfterMove = function()
                {
                    if (gCustomizeMode._customizing && !gCustomizeMode._transitioning)
                    {
                        CMDebug.log("[dropbug] _initializeDragAfterMove (main): Hiding item");
                        item.hidden = true;
                        this._showPanelCustomizationPlaceholders();
                        CMDebug.log("Starting drag position manager");
                        EchelonDragPositionManager.start(window);
                        if (item.nextSibling)
                        {
                            this._echelonSetGridDragActive(item.nextSibling, draggedItem, "before");
                            gCustomizeMode._dragOverItem = item.nextSibling;
                        }
                    }
                    this._initializeDragAfterMove = null;
                    clearTimeout(this._dragInitializeTimeout);
                }.bind(this);
                this._dragInitializeTimeout = setTimeout(this._initializeDragAfterMove, 0);
            }
        }

        /**
         * Behaviours to run when dragging is started within a foreign area.
         *
         * @param {Event} event
         */
        onForeignDragStart(event)
        {
            if (!this._initializeDragAfterMove)
            {
                this._initializeDragAfterMove = function()
                {
                    if (gCustomizeMode._customizing && !gCustomizeMode._transitioning)
                    {
                        this._showPanelCustomizationPlaceholders();
                        CMDebug.log("Starting drag position manager from foreign item");
                        EchelonDragPositionManager.start(window);
                    }

                    this._initializeDragAfterMove = null;
                    clearTimeout(this._dragInitializeTimeout);
                }.bind(this);
                this._dragInitializeTimeout = setTimeout(this._initializeDragAfterMove, 0);
            }
        }

        /**
         * Handles dropping an item in the custom area.
         *
         * @param {Event} aEvent
         * @param {Element} aOverrideTarget
         */
        onDragDrop(aEvent, aOverrideTarget)
        {
            if (gCustomizeMode._isUnwantedDragDrop(aEvent))
            {
                return;
            }

            //__dumpDragData(aEvent);
            this._initializeDragAfterMove = null;
            gCustomizeMode.window.clearTimeout(this._dragInitializeTimeout);
            this._stopNativeDeferredInit();

            let targetArea = gCustomizeMode._getCustomizableParent(
                aOverrideTarget || aEvent.currentTarget
            );
            let document = aEvent.target.ownerDocument;
            let documentId = document.documentElement.id;
            let draggedItemId = aEvent.dataTransfer.mozGetDataAt(
                this.DRAG_DATA_TYPE_PREFIX + documentId,
                0
            );
            let draggedWrapper = document.getElementById("wrapper-" + draggedItemId);
            let originArea = gCustomizeMode._getCustomizableParent(draggedWrapper);
            if (gCustomizeMode._dragSizeMap)
            {
                gCustomizeMode._dragSizeMap = new WeakMap();
            }
            // Do nothing if the target area or origin area are not customizable.
            if (!targetArea || !originArea)
            {
                return;
            }

            // test
            if (!gCustomizeMode._dragOverItem)
                return;

            let targetNode = gCustomizeMode._dragOverItem;
            let dropDir = targetNode.getAttribute("dragover");
            // Need to insert *after* this node if we promised the user that:
            if (targetNode != targetArea && dropDir == "after")
            {
                if (targetNode.nextElementSibling)
                {
                    targetNode = targetNode.nextElementSibling;
                }
                else
                {
                    targetNode = targetArea;
                }
            }
            if (targetNode.tagName == "toolbarpaletteitem")
            {
                targetNode = targetNode.firstElementChild;
            }

            let dragOverItem = gCustomizeMode._dragOverItem;
            this._echelonCancelActiveDrag(dragOverItem, null, true);
            this._removePanelCustomizationPlaceholders();

            try
            {
                this._echelonApplyDrop(
                    aEvent,
                    targetArea,
                    originArea,
                    draggedItemId,
                    targetNode
                );
            }
            catch (ex)
            {
                console.error(ex, ex.stack);
            }

            this._showPanelCustomizationPlaceholders();
        }

        /**
         * Behaviours to run when dropping an item in a foreign area.
         *
         * @param {Event} event
         */
        onForeignDragDrop(event)
        {
            this._initializeDragAfterMove = null;
            clearTimeout(this._dragInitializeTimeout);

            this._safeStopPositionManager();
            this._showPanelCustomizationPlaceholders();
        }

        /**
         * Handles the drag area leaving the custom area.
         *
         * @param {Event} aEvent
         */
        onDragLeave(aEvent)
        {
            if (gCustomizeMode._isUnwantedDragDrop(aEvent))
            {
                return;
            }

            // When leaving customization areas, cancel the drag on the last dragover item
            // We've attached the listener to areas, so aEvent.currentTarget will be the area.
            // We don't care about dragleave events fired on descendants of the area,
            // so we check that the event's target is the same as the area to which the listener
            // was attached.
            if (gCustomizeMode._dragOverItem && aEvent.target == aEvent.currentTarget)
            {
                this._echelonCancelActiveDrag(gCustomizeMode._dragOverItem);
                gCustomizeMode._dragOverItem = null;
            }
        }

        /**
         * Handles the user ending dragging over the custom area.
         *
         * @param {Event} aEvent
         */
        onDragEnd(aEvent)
        {
            if (gCustomizeMode._isUnwantedDragDrop(aEvent))
            {
                return;
            }
            this._initializeDragAfterMove = null;
            clearTimeout(this._dragInitializeTimeout);
            this._stopNativeDeferredInit();

            let document = aEvent.target.ownerDocument;
            document.documentElement.removeAttribute("customizing-movingItem");

            let documentId = document.documentElement.id;
            if (!aEvent.dataTransfer.mozTypesAt(0))
            {
                return;
            }

            let draggedItemId = aEvent.dataTransfer.mozGetDataAt(
                this.DRAG_DATA_TYPE_PREFIX + documentId,
                0
            );

            let draggedWrapper = document.getElementById("wrapper-" + draggedItemId);

            // DraggedWrapper might no longer available if a widget node is
            // destroyed after starting (but before stopping) a drag.
            if (draggedWrapper)
            {
                CMDebug.log("[dropbug] onDragEnd: Showing item");
                draggedWrapper.hidden = false;
                draggedWrapper.removeAttribute("mousedown");

                let toolbarParent = draggedWrapper.closest("toolbar");
                if (toolbarParent)
                {
                    toolbarParent.style.removeProperty("min-height");
                }
            }

            if (gCustomizeMode._dragOverItem)
            {
                this._echelonCancelActiveDrag(gCustomizeMode._dragOverItem);
                gCustomizeMode._dragOverItem = null;
            }

            CMDebug.log("Ending drag position manager");
            this._safeStopPositionManager();
            OriginalDragPositionManager.stop(); // TODO: is this needed?
            this._showPanelCustomizationPlaceholders();
        }

        /**
         * Behaviours to run when ending a drag over a foreign area.
         *
         * @param {Event} event
         */
        onForeignDragEnd(event)
        {
            this._initializeDragAfterMove = null;
            clearTimeout(this._dragInitializeTimeout);

            this._safeStopPositionManager();
            this._showPanelCustomizationPlaceholders();
        }

        /**
         * Handles dragging over the custom area.
         *
         * @param {Event} event
         */
        onDragOver(event)
        {
            if (gCustomizeMode._isUnwantedDragDrop(event))
                return;

            if (this._initializeDragAfterMove)
                this._initializeDragAfterMove();

            let document = event.target.ownerDocument;
            let documentId = document.documentElement.id;

            if (!event.dataTransfer.mozTypesAt(0).length)
                return;

            let draggedItemId = event.dataTransfer.mozGetDataAt(
                this.DRAG_DATA_TYPE_PREFIX + documentId,
                0
            );

            let draggedWrapper = document.getElementById("wrapper-" + draggedItemId);
            let targetArea = gCustomizeMode._getCustomizableParent(event.currentTarget);
            let originArea = gCustomizeMode._getCustomizableParent(draggedWrapper);

            // Do nothing if the target or origin are not customisable.
            if (!targetArea || !originArea)
                return;

            // Do nothing if the widget is not supported in the menu panel.
            if (!this._echelonIsSupportedWidget(draggedItemId))
                return;

            let targetAreaType = "menu-panel";
            let targetNode = this._echelonGetDragOverNode(
                event,
                targetArea,
                targetAreaType,
                draggedItemId
            );

            // We need to determine the place the widget is being dropped in
            // the target.
            let dragOverItem, dragValue;
            if (targetNode == CustomizableUI.getCustomizationTarget(targetArea))
            {
                // We'll assume if the user is dragging directly over the target, that
                // they're attempting to append a child to that target.
                dragOverItem = targetNode.lastElementChild || targetNode;
                dragValue = "after";
            }
            else
            {
                let targetParent = targetNode.parentNode;
                let position = Array.prototype.indexOf.call(
                    targetParent.children,
                    targetNode
                );

                dragOverItem = targetParent.children[position];
                dragValue = "before";
            }

            if (gCustomizeMode._dragOverItem && dragOverItem != gCustomizeMode._dragOverItem)
            {
                this._echelonCancelActiveDrag(gCustomizeMode._dragOverItem, dragOverItem);
            }

            if (
                dragOverItem != gCustomizeMode._dragOverItem ||
                dragValue != dragOverItem.getAttribute("dragover")
            )
            {
                if (dragOverItem != CustomizableUI.getCustomizationTarget(targetArea))
                {
                    let draggedItem = window.document.getElementById(draggedItemId);
                    this._echelonSetGridDragActive(dragOverItem, draggedItem, dragValue);
                    //gCustomizeMode._setDragActive(dragOverItem, dragValue, draggedItemId, "toolbar");
                }
                gCustomizeMode._dragOverItem = dragOverItem;
                targetArea.setAttribute("draggingover", "true");
            }

            event.preventDefault();
            event.stopPropagation();
        }

        /**
         * Behaviours to run when dragging over a foreign area.
         */
        onForeignDragOver()
        {
            if (this._initializeDragAfterMove)
                this._initializeDragAfterMove();
        }

        /**
         * Gets all foreign area elements.
         *
         * @returns {NodeListOf<Element>}
         */
        getForeignAreas()
        {
            return document.querySelectorAll(".customization-target:not(#PanelUI-contents), #customization-palette");
        }

        /**
         * Stops the position manager and cleans up safely.
         */
        _safeStopPositionManager()
        {
            CMDebug.log("_safeStopPositionManager");
            let manager;
            if (manager = EchelonDragPositionManager.getManagerForArea(this.contents))
            {
                manager.clearPlaceholders(this.contents);
                EchelonDragPositionManager.stop();
            }
        }

        /**
         * Stops deferred initialization for the native customise mode.
         *
         * This is used in the custom implementations of the drag drop/end handlers.
         * For the foreign handlers, these are added on top of the existing events
         * which already handle this functionality rather than replacing them, so
         * this is not necessary in those functions.
         *
         * We still need to initialise the native ones in order for foreign dropping
         * to work from within the custom area.
         */
        _stopNativeDeferredInit()
        {
            gCustomizeMode._initializeDragAfterMove = null;
            clearTimeout(gCustomizeMode._dragInitializeTimeout);
            gCustomizeMode._dragInitializeTimeout = null;
        }

        /**
         * Determines if a given widget ID corresponds to a widget that may be placed in the panel.
         *
         * @param {string} widgetId
         * @returns 
         */
        _echelonIsSupportedWidget(widgetId)
        {
            /*
             * This is a static list of IDs to skip because they can only be included
             * in a toolbar or can't be moved at all.
             */
            const EXCLUDED_IDS = [
                "back-button",
                "forward-button",
                "urlbar-container",
                "stop-reload-button",
                "personal-bookmarks",
                "alltabs-button",
                "unified-extensions-button",

                // Library panel style is incompatible with the Australis panel,
                // so we just ignore it
                "library-button"
            ];

            if (CustomizableUI.isSpecialWidget(widgetId))
            {
                // We don't support springs/spacers/separators in the panel.
                return false;
            }
            else if (CustomizableUI.isWebExtensionWidget(widgetId))
            {
                // We want to be able to support extension widgets eventually,
                // but more work must be done to undo unified extensions changes
                // broadly. For now, ignore them.
                return false;
            }
            else if (EXCLUDED_IDS.includes(widgetId))
            {
                return false;
            }

            return true;
        }

        /**
         * Custom behaviour to get the drag over node while working within the custom area.
         *
         * @param {Event} aEvent
         * @param {Element} aAreaElement
         * @param {string} aAreaType
         * @param {string} aDraggedItemId
         */
        _echelonGetDragOverNode(aEvent, aAreaElement, aAreaType, aDraggedItemId)
        {
            let expectedParent =
                CustomizableUI.getCustomizationTarget(aAreaElement) || aAreaElement;
            if (!expectedParent.contains(aEvent.target))
            {
                return expectedParent;
            }
            // Offset the drag event's position with the offset to the center of
            // the thing we're dragging
            let dragX = aEvent.clientX - gCustomizeMode._dragOffset.x;
            let dragY = aEvent.clientY - gCustomizeMode._dragOffset.y;

            // Ensure this is within the container
            let boundsContainer = expectedParent;
            let bounds = gCustomizeMode._getBoundsWithoutFlushing(boundsContainer);
            dragX = Math.min(bounds.right, Math.max(dragX, bounds.left));
            dragY = Math.min(bounds.bottom, Math.max(dragY, bounds.top));

            let targetNode;
            let positionManager =
                EchelonDragPositionManager.getManagerForArea(aAreaElement);
            // Make it relative to the container:
            dragX -= bounds.left;
            dragY -= this.contents.getBoundingClientRect().top;
            // Find the closest node:
            targetNode = positionManager.find(aAreaElement, dragX, dragY, aDraggedItemId);

            return targetNode || aEvent.target;
        }

        /**
         * Activates dragging within the custom area.
         *
         * @param {Element} aDragOverNode
         * @param {Element} aDraggedItem
         * @param {string} aValue
         */
        _echelonSetGridDragActive(aDragOverNode, aDraggedItem, aValue)
        {
            if (!aDragOverNode)
                return;

            if (aDragOverNode.getAttribute("dragover") != aValue)
            {
                aDragOverNode.setAttribute("dragover", aValue);
            }

            let targetArea = gCustomizeMode._getCustomizableParent(aDragOverNode);
            let draggedWrapper = gCustomizeMode.$("wrapper-" + aDraggedItem.id);
            let originArea = gCustomizeMode._getCustomizableParent(draggedWrapper);
            let positionManager = EchelonDragPositionManager.getManagerForArea(targetArea);
            let draggedSize = gCustomizeMode._getDragItemSize(aDragOverNode, aDraggedItem);
            let isWide = aDraggedItem.classList.contains("panel-wide-item");
            positionManager.insertPlaceholder(
                targetArea,
                aDragOverNode,
                draggedSize,
                originArea == targetArea,
                isWide
            );
        }

        /**
         * Cancels active dragging within the custom area.
         *
         * @param {Element} aItem
         * @param {Element} aNextItem
         * @param {boolean} aNoTransition
         */
        _echelonCancelActiveDrag(aItem, aNextItem, aNoTransition)
        {
            let currentArea = gCustomizeMode._getCustomizableParent(aItem);
            if (!currentArea)
            {
                return;
            }

            if (currentArea.id != "PanelUI-contents")
            {
                return gCustomizeMode._cancelDragActive(aItem, aNextItem, aNoTransition);
            }

            let nextArea = aNextItem ? gCustomizeMode._getCustomizableParent(aNextItem) : null;
            if (currentArea != nextArea)
            {
                currentArea.removeAttribute("draggingover");
            }

            aItem.removeAttribute("dragover");
            if (aNextItem)
            {
                if (nextArea == currentArea)
                {
                    // No need to do anything if we're still dragging in this area:
                    return;
                }
            }
            // Otherwise, clear everything out:
            let positionManager = EchelonDragPositionManager.getManagerForArea(currentArea);
            positionManager.clearPlaceholders(currentArea, aNoTransition);
        }

        /**
         * Applies drag dropping in the custom area.
         *
         * @param {Event} aEvent
         * @param {Element} aTargetArea
         * @param {Element} aOriginArea
         * @param {string} aDraggedItemId
         * @param {Element} aTargetNode
         */
        _echelonApplyDrop(aEvent, aTargetArea, aOriginArea, aDraggedItemId, aTargetNode)
        {
            let document = aEvent.target.ownerDocument;
            let draggedItem = document.getElementById(aDraggedItemId);
            CMDebug.log("[dropbug] _echelonApplyDrop: Showing item");
            draggedItem.hidden = false;
            draggedItem.removeAttribute("mousedown");
        
            let toolbarParent = draggedItem.closest("toolbar");
            if (toolbarParent)
            {
                toolbarParent.style.removeProperty("min-height");
            }

            // Do nothing if the target was dropped onto itself (ie, no change in area
            // or position).
            if (draggedItem == aTargetNode)
            {
                return;
            }
        
            if (!CustomizableUI.canWidgetMoveToArea(aDraggedItemId, aTargetArea.id))
            {
                return;
            }

            // Skipintoolbarset items won't really be moved:
            let areaCustomizationTarget = CustomizableUI.getCustomizationTarget(aTargetArea);
            if (draggedItem.getAttribute("skipintoolbarset") == "true")
            {
                // These items should never leave their area:
                if (aTargetArea != aOriginArea)
                {
                    return;
                }
                let place = draggedItem.parentNode.getAttribute("place");
                gCustomizeMode.unwrapToolbarItem(draggedItem.parentNode);

                if (aTargetNode == areaCustomizationTarget)
                {
                    areaCustomizationTarget.appendChild(draggedItem);
                }
                else
                {
                    gCustomizeMode.unwrapToolbarItem(aTargetNode.parentNode);
                    areaCustomizationTarget.insertBefore(draggedItem, aTargetNode);
                    gCustomizeMode.wrapToolbarItem(aTargetNode, place);
                }

                gCustomizeMode.wrapToolbarItem(draggedItem, place);
                return;
            }
        
            // Is the target the customization area itself? If so, we just add the
            // widget to the end of the area.
            if (aTargetNode == areaCustomizationTarget)
            {
                CustomizableUI.addWidgetToArea(aDraggedItemId, aTargetArea.id);
                this.onDragEnd(aEvent);
                return;
            }
        
            // We need to determine the place that the widget is being dropped in
            // the target.
            let placement;
            let itemForPlacement = aTargetNode;
            // Skip the skipintoolbarset items when determining the place of the item:
            while (
                itemForPlacement &&
                itemForPlacement.getAttribute("skipintoolbarset") == "true" &&
                itemForPlacement.parentNode &&
                itemForPlacement.parentNode.nodeName == "toolbarpaletteitem"
            )
            {
                itemForPlacement = itemForPlacement.parentNode.nextElementSibling;
                if (
                    itemForPlacement &&
                    itemForPlacement.nodeName == "toolbarpaletteitem"
                )
                {
                    itemForPlacement = itemForPlacement.firstElementChild;
                }
            }
            if (itemForPlacement)
            {
                let targetNodeId = itemForPlacement.nodeName == "toolbarpaletteitem"
                    ? itemForPlacement.firstElementChild && itemForPlacement.firstElementChild.id
                    : itemForPlacement.id;
                placement = CustomizableUI.getPlacementOfWidget(targetNodeId);
            }
            let position = placement ? placement.position : null;
        
            // Is the target area the same as the origin? Since we've already handled
            // the possibility that the target is the customization palette, we know
            // that the widget is moving within a customizable area.
            if (aTargetArea == aOriginArea)
            {
                CustomizableUI.moveWidgetWithinArea(aDraggedItemId, position);
            }
            else
            {
                CustomizableUI.addWidgetToArea(aDraggedItemId, aTargetArea.id, position);
            }
        
            this.onDragEnd(aEvent);
        
            // If we dropped onto a skipintoolbarset item, manually correct the drop location:
            if (aTargetNode != itemForPlacement)
            {
                let draggedWrapper = draggedItem.parentNode;
                let container = draggedWrapper.parentNode;
                container.insertBefore(draggedWrapper, aTargetNode.parentNode);
            }
        }

        _showPanelCustomizationPlaceholders()
        {
            let doc = document;
            let contents = this.contents;
            let narrowItemsAfterWideItem = 0;
            let node = contents.lastChild;

            while (
                node &&
                !node.classList.contains("panel-wide-item") &&
                (!node.firstChild || !node.firstChild.classList.contains("panel-wide-item"))
            )
            {
                if (!node.hidden && !node.classList.contains(this.PLACEHOLDER_CLASS))
                {
                    narrowItemsAfterWideItem++;
                }

                node = node.previousSibling;
            }

            let orphanedItems = narrowItemsAfterWideItem % this.PANEL_COLUMN_COUNT;
            let placeholders = this.PANEL_COLUMN_COUNT - orphanedItems;

            let currentPlaceholderCount = contents.querySelectorAll("." + this.PLACEHOLDER_CLASS).length;
            if (placeholders > currentPlaceholderCount)
            {
                // secret JS down-to operator :O
                while (placeholders --> currentPlaceholderCount)
                {
                    let placeholder = doc.createElement("toolbarpaletteitem");
                    placeholder.classList.add(this.PLACEHOLDER_CLASS);
                    placeholder.setAttribute("skipintoolbarset", "true");
                    let placeholderChild = doc.createElement("toolbarbutton");
                    placeholderChild.classList.add(this.PLACEHOLDER_CLASS + "-child");
                    placeholderChild.setAttribute("skipintoolbarset", "true");
                    placeholder.appendChild(placeholderChild);
                    contents.appendChild(placeholder);
                }
            }
            else if (placeholders < currentPlaceholderCount)
            {
                while (placeholders++ < currentPlaceholderCount)
                {
                    contents.querySelectorAll("." + this.PLACEHOLDER_CLASS)[0].remove();
                }
            }
        }

        _removePanelCustomizationPlaceholders()
        {
            let contents = this.contents;
            let oldPlaceholders = contents.querySelectorAll(
                "." + this.PLACEHOLDER_CLASS + ", ." + this.PLACEHOLDER_CLASS + "-child"
            );
            for (const elm of oldPlaceholders)
            {
                elm.remove();
            }
        }

    })(this);

    //-----------------------------------------------------------------------------------
    // Shadowing implementation (clone elements for native widget subview hack):
    //

    shadowManager = new (class
    {
        VIEW_MODE_ORIGINAL = 0;
        VIEW_MODE_SHADOWS = 1;

        CONTAINER_SELECTOR = "#PanelUI-contents";

        parent = null;
        shadowContainer = null;
        viewMode = this.VIEW_MODE_SHADOWS;

        mutationRecords = {};

        mutationObserver = new MutationObserver(this.handleMutation);

        constructor(parent)
        {
            this.parent = parent;
        }

        init()
        {
            this.shadowContainer = this.parent.mainView?.querySelector(".shadow-container") || new DocumentFragment;
        }

        onInitialBuild()
        {
            this.enumerateElements();
        }

        observe()
        {
            let itemsContainer = this.parent.contents;
            this.mutationObserver.observe(itemsContainer, {
                attributes: false,
                childList: true,
                subtree: false
            });
        }

        unobserve()
        {
            this.mutationObserver.disconnect();
        }

        elementVisitor(elm)
        {
            if (elm.id in this.parent.shadowedElementMap)
            {
                // If the element already exists, then we only need to synchronize the state:
                if (elm.getAttribute("echelon-panel-shadowed") || elm.__echelonShadowed)
                {
                    let record = this.mutationRecords[elm.id];
                    this.synchronizeElementViewState(record);
                    return;
                }

                // Otherwise create:
                elm.__echelonShadowed = true; // mark so we don't visit again
                let cloneElm = this.makeCloneElement(elm);
                let record = this.addMutationRecord(elm, cloneElm);

                this.synchronizeElementViewState(record);

                // The above function call doesn't handle installation into the DOM if the
                // view state does not match, so we must add it ourselves in this case.
                if (cloneElm.parentNode == null)
                {
                    cloneElm.id += "-shadowed-clone";
                    this.shadowContainer.appendChild(cloneElm);
                }
            }
        }

        enumerateElements()
        {
            for (let elm of this.parent.contents.children)
            {
                this.elementVisitor(elm);
            }
        }

        setOriginalView()
        {
            this.viewMode = this.VIEW_MODE_ORIGINAL;
            this.enumerateElements();
        }

        setShadowsView()
        {
            this.viewMode = this.VIEW_MODE_SHADOWS;
            this.enumerateElements();
        }

        makeCloneElement(elm)
        {
            let clone = elm.cloneNode(true);
            clone.setAttribute("echelon-panel-shadowed", "true");
            return clone;
        }

        addMutationRecord(originalEl, cloneEl)
        {
            this.mutationRecords[originalEl.id] = {
                original: originalEl,
                clone: cloneEl,
                id: originalEl.id
            };

            return this.mutationRecords[originalEl.id];
        }

        synchronizeElementViewState(record)
        {
            let visibilityInfo = this.getRecordVisibilityInfo(record);

            if (visibilityInfo.bad)
            {
                let newVisEl = visibilityInfo.invisibleRef;
                let oldVisEl = visibilityInfo.visibleRef;
                let originalId = record.id;

                newVisEl.id = originalId;
                oldVisEl.id = originalId + "-shadowed-" + visibilityInfo.name;

                oldVisEl.insertAdjacentElement("afterend", newVisEl);
                this.shadowContainer.appendChild(oldVisEl);
            }
        }

        getRecordVisibilityInfo(record)
        {
            let result = {
                name: "",
                visibleRef: null,
                invisibleRef: null,
                bad: false
            };

            if (record.original.closest(this.CONTAINER_SELECTOR))
            {
                result.name = "original";
                result.visibleRef = record.original;
                result.invisibleRef = record.clone;
                result.bad = this.viewMode != this.VIEW_MODE_ORIGINAL;
            }
            else if (record.clone.closest(this.CONTAINER_SELECTOR))
            {
                result.name = "clone";
                result.visibleRef = record.clone;
                result.invisibleRef = record.original;
                result.bad = this.viewMode != this.VIEW_MODE_SHADOWS;
            }
            else
            {
                throw new Error("Echelon Panel Error: Bad visibility state (neither visible).")
            }

            return result;
        }

        handleMutation(mutationList, observer)
        {
            for (let mutation of mutationList)
            {
                for (let elm of mutation.addedNodes)
                {
                    if (elm.id in this.mutationRecords)
                    {
                        this.synchronizeElementViewState(this.mutationRecords[elm.id]);
                    }
                }
            }
        }

    })(this);
}

g_echelonAustralisPanel = new AustralisPanelController;
g_echelonAustralisPanel.init();

}