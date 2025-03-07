// ==UserScript==
// @name			Echelon :: Appmenu
// @description 	Adds back appmenu (Firefox menu) functionality.
// @author			Travis, ephemeralViolette
// @include			main
// ==/UserScript==

let g_echelonFirefoxButton = null;

{
	var { PrefUtils, waitForElement, BrandUtils, renderElement } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
	renderElement = renderElement.bind(window);
	waitForElement = waitForElement.bind(window);

	function setAttributes(element, attributes)
	{
		Object.keys(attributes).forEach(attr => {
			element.setAttribute(attr, attributes[attr]);
		});
	}

	/**
	 * A port of the removed splitmenu element to modern Firefox.
	 *
	 * This was removed alongside the removal of XBL (XUL templating language), which means that
	 * a reimplementation would also require a port to JavaScript.
	 */
	class SplitMenuElement extends HTMLElement
	{
		_menuDelay = 600;
		
		get menu()
		{
			return this.querySelector(".splitmenu-menu");
		}
		
		get menuitem()
		{
			return this.querySelector(".splitmenu-menuitem");
		}
		
		get _parentMenupopup()
		{
			return this._getParentMenupopup(this);
		}
		
		connectedCallback()
		{
			/*
			* Did you know about `handleEvent`? I sure didn't.
			*
			* This is some cool-ass function that browsers include for legacy reasons that
			* resembles a proper event API, kinda like message handlers in WinAPI.
			*
			* https://dev.to/rikschennink/the-fantastically-magical-handleevent-function-1bp4
			*/
			this._parentMenupopup.addEventListener("DOMMenuItemActive", this, false);
			this._parentMenupopup.addEventListener("popuphidden", this, false);
			
			this.addEventListener("click", this.handleClick, true);
			this.addEventListener("mouseover", this.handleMouseover);
			this.addEventListener("popupshowing", this.handlePopupshowing);
		}
		
		disconnectedCallback()
		{
			this._parentMenupopup.removeEventListener("DOMMenuItemActive", this, false);
			this._parentMenupopup.removeEventListener("popuphidden", this, false);
			
			this.removeEventListener("click", this.handleClick, true);
			this.removeEventListener("mouseover", this.handleMouseover);
			this.removeEventListener("popupshowing", this.handlePopupshowing);
		}
		
		setActiveStyle(status = true)
		{
			if (status == false)
			{
				Array.from(this.children).forEach(child => child.removeAttribute("_moz-menuactive"));
				this.removeAttribute("active");
			}
			else
			{
				Array.from(this.children).forEach(child => child.setAttribute("_moz-menuactive", "true"));
				this.setAttribute("active", "true");
			}
		}
		
		_getParentMenupopup(aNode)
		{
			let node = aNode.parentNode;
			while (node)
			{
			if (node.localName == "menupopup")
				break;
			node = node.parentNode;
			}
			return node;
		}
		
		handleEvent(event)
		{
			switch (event.type)
			{
				case "DOMMenuItemActive":
					if (
						this.getAttribute("active") == "true" && 
						!this.contains(event.target) && 
						this._getParentMenupopup(event.target) == this._parentMenupopup
					)
					{
						this.setActiveStyle(false);
					}
					break;
				case "popuphidden":
					if (event.target == this._parentMenupopup)
					{
						this.setActiveStyle(false);
					}
					break;
			}
		}
		
		handleClick(e)
		{
			if (this.getAttribute("disabled") == "true")
			{
				// Prevent the command from being carried out
				e.stopPropagation();
				return;
			}
			
			let node = e.originalTarget;
			while (node)
			{
				if (node == this.menuitem)
				{
					break;
				}
				if (node == this)
				{
					return;
				}
				node = node.parentNode;
			}
			
			this._getParentMenupopup(this).hidePopup();
		}
		
		handleMouseover(e)
		{
			if (this.getAttribute("active") != "true" && this.getAttribute("disabled") != "true")
			{
				let event = document.createEvent("Events");
				event.initEvent("DOMMenuItemActive", true, false);
				this.dispatchEvent(event);
				
				// Visual menu selection effect only works if these are set:
				this.setActiveStyle(true);
				
				let self = this;
				setTimeout(function() {
					if (self.getAttribute("active") == "true")
						self.menu.open = true;
				}, this._menuDelay);
			}
		}
		
		handlePopupshowing(e)
		{
			if (e.target == this.firstChild && this._parentMenupopup._currentPopup)
			{
				this._parentMenupopup._currentPopup.hidePopup();
			}
		}
	}
	customElements.define("echelon-splitmenu", SplitMenuElement);

	/**
	 * Reimplementation of the Firefox button (or appmenu).
	 */
	class FirefoxButton
	{
		/**
		 * The button container element, #appmenu-button-container
		 *
		 * @var {XULElement}
		 */
		appMenuButtonContainerEl = null;
		
		/**
		 * The button element, #appmenu-button
		 *
		 * @var {XULElement}
		 */
		appMenuButtonEl = null;
		
		/**
		 * The menupopup element.
		 *
		 * @var {XULElement}
		 */
		menuEl = null;

		/**
		 * The stringbundle containing localization strings.
		 * 
		 * @var {nsIStringBundle}
		 */
		strings = Services.strings.createBundle("chrome://echelon/locale/properties/appmenu.properties");

		/**
		 * Current locale.
		 * 
		 * @var {string}
		 */
		locale = Services.locale.requestedLocale;

		/**
		 * Current style setting.
		 * 
		 * @var {number}
		 */
		style = PrefUtils.tryGetIntPref("Echelon.Appearance.Style");

		/**
		 * Whether or not the menu has been initialized and labels have been filled.
		 * 
		 * @var {boolean}
		 */
		initialized = false;
		
		constructor()
		{
			try
			{
				//
				// Button creation and insertion
				//
				waitForElement("#titlebar-content").then(e => {
					let browserName = BrandUtils.getBrandingKey("brandShortName");

					this.appMenuButtonContainerEl = document.createXULElement("hbox");
					const appMenuButtonContainerAttrs = {
						"id": "appmenu-button-container"
					};
					setAttributes(this.appMenuButtonContainerEl, appMenuButtonContainerAttrs);
					
					this.appMenuButtonEl = document.createXULElement("button");
					const appMenuButtonAttrs = {
						"id":	 "appmenu-button",
						"type": "menu",
						"label": browserName
					};
					setAttributes(this.appMenuButtonEl, appMenuButtonAttrs);
					
					e.insertBefore(this.appMenuButtonContainerEl, e.firstChild);
					this.appMenuButtonContainerEl.appendChild(this.appMenuButtonEl);
					
					//
					// Creates the Firefox menu contents.
					//
					this.initMenu(this.appMenuButtonEl);
				});
			}
			catch (e) { console.log(e); } // ignore, nothing important
		}
		
		/**
		 * Initialises the popup element HTML.
		 */
		initMenu(parent)
		{
			// Local alias
			const elm = renderElement;
			const splitmenu = this.renderSplitMenu;
			
			this.menuEl = document.createXULElement("menupopup");
			this.menuEl.id = "echelon-appmenu-button-menu";
			
			let elementSet = elm("xul:hbox", {}, [
				elm("xul:vbox", {id: "appmenuPrimaryPane"}, [
					splitmenu(
						{
							"id": "appmenu_newTab",
							"data-l10n-id": "new_tab",
							"onclick": "BrowserOpenTab()"
						},
						[
							elm("xul:menuitem", {
								"id": "appmenu_newTab_popup",
								"data-l10n-id": "new_tab",
								"command": "cmd_newNavigatorTab",
								"key": "key_newNavigatorTab"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_newNavigator",
								"data-l10n-id": "new_window",
								"command": "cmd_newNavigator",
								"key": "key_newNavigator"
							}),
							elm("xul:menuseparator"),
							elm("xul:menuitem", {
								"id": "appmenu_openFile",
								"data-l10n-id": "open_file",
								"command": "Browser:OpenFile",
								"key": "openFileKb"
							})
						]
					),
					elm("xul:menuitem", {
						"id": "appmenu_privateBrowsing",
						"class": "menuitem-iconic menu-item-iconic-tooltip",
						"data-l10n-id": (this.style >= 3) ? "private_browsing_new" : "private_browsing",
						"command": "Tools:PrivateBrowsing",
						"key": "key_privatebrowsing"
					}),
					elm("xul:menuseparator", {"class": "appmenu-menuseparator"}),
					elm("xul:hbox", {}, [
						elm("xul:menuitem", {
							"id": "appmenu-edit-label",
							"data-l10n-id": "edit",
							"disabled": "true"
						}),
						elm("xul:toolbarbutton", {
							"id": "appmenu-cut",
							"class": "appmenu-edit-button",
							"command": "cmd_cut",
							"onclick": "if (!this.disabled) hidePopup();",
							"data-l10n-id": "cut"
						}),
						elm("xul:toolbarbutton", {
							"id": "appmenu-copy",
							"class": "appmenu-edit-button",
							"command": "cmd_copy",
							"onclick": "if (!this.disabled) hidePopup();",
							"data-l10n-id": "copy"
						}),
						elm("xul:toolbarbutton", {
							"id": "appmenu-paste",
							"class": "appmenu-edit-button",
							"command": "cmd_paste",
							"onclick": "if (!this.disabled) hidePopup();",
							"data-l10n-id": "paste"
						}),
						elm("xul:spacer", {"flex": "1"}),
						elm("xul:menu", {"id": "appmenu-editmenu"}, [
							elm("xul:menupopup", {"id": "appmenu-editmenu-menupopup"}, [
								elm("xul:menuitem", {
									"id": "appmenu-editmenu-cut",
									"class": "menuitem-iconic",
									"data-l10n-id": "cut",
									"key": "key_cut",
									"command": "cmd_cut"
								}),
								elm("xul:menuitem", {
									"id": "appmenu-editmenu-copy",
									"class": "menuitem-iconic",
									"data-l10n-id": "copy",
									"key": "key_copy",
									"command": "cmd_copy"
								}),
								elm("xul:menuitem", {
									"id": "appmenu-editmenu-paste",
									"class": "menuitem-iconic",
									"data-l10n-id": "paste",
									"key": "key_paste",
									"command": "cmd_paste"
								}),
								elm("xul:menuseparator", {"class": "appmenu-menuseparator"}),
								// These following buttons don't have icons.
								elm("xul:menuitem", {
									"id": "appmenu-editmenu-undo",
									"data-l10n-id": "undo",
									"key": "key_undo",
									"command": "cmd_undo"
								}),
								elm("xul:menuitem", {
									"id": "appmenu-editmenu-redo",
									"data-l10n-id": "redo",
									"key": "key_redo",
									"command": "cmd_redo"
								}),
								elm("xul:menuseparator", {"class": "appmenu-menuseparator"}),
								elm("xul:menuitem", {
									"id": "appmenu-editmenu-selectAll",
									"data-l10n-id": "select_all",
									"key": "key_selectAll",
									"command": "cmd_selectAll"
								}),
								elm("xul:menuseparator", {"class": "appmenu-menuseparator"}),
								elm("xul:menuitem", {
									"id": "appmenu-editmenu-delete",
									"data-l10n-id": "delete",
									"key": "key_delete",
									"command": "cmd_delete"
								})
							])
						])
					]),
					elm("xul:menuitem", {
						"id": "appmenu_find",
						"class": "menuitem-tooltip",
						"data-l10n-id": "find",
						"command": "cmd_find",
						"key": "key_find"
					}),
					elm("xul:menuseparator", {"class": "appmenu-menuseparator"}),
					elm("xul:menuitem", {
						"id": "appmenu_savePage",
						"class": "menuitem-tooltip",
						"data-l10n-id": "save_page",
						"command": "Browser:SavePage",
						"key": "key_savePage"
					}),
					elm("xul:menuitem", {
						"id": "appmenu_sendLink",
						"data-l10n-id": (this.style >= 3) ? "send_link_new" : "send_link",
						"command": "Browser:SendLink"
					}),
					splitmenu(
						{
							"id": "appmenu_print",
							"data-l10n-id": "print",
							"iconic": "true",
							"command": "cmd_print"
						},
						[
							elm("xul:menuitem", {
								"id": "appmenu_print_popup",
								"data-l10n-id": "print",
								"command": "cmd_print",
								"key": "printKb"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_printSetup",
								"data-l10n-id": "page_setup",
								"command": "cmd_pageSetup"
							})
						]
					),
					elm("xul:menuseparator", {"class": "appmenu-menuseparator"}),
					elm("xul:menu", {
						"id": "appmenu_webDeveloper",
						"data-l10n-id": "web_developer"
					}, [
						elm("xul:menupopup", {"id": "appmenu_webDeveloper_popup"}, [
							elm("xul:menuitem", {
								"id": "appmenu_pageInspect",
								"data-l10n-id": "toggle_toolbox",
								"oncommand": `(function() {
									var target = document.querySelector("#menu_devToolbox");
									target && target.click();
								})()`,
								"key": "key_toggleToolbox"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_pageSource",
								"data-l10n-id": "view_source",
								"command": "View:PageSource",
								"key": "key_viewSource"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_browserToolbox",
								"data-l10n-id": "browser_toolbox",
								"oncommand": `(function() {
									var target = document.querySelector("#menu_browserToolbox");
									target && target.click();
								})()`,
								"key": "key_browserToolbox"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_browserConsole",
								"data-l10n-id": "browser_console",
								"oncommand": `(function() {
									var target = document.querySelector("#menu_browserConsole");
									target && target.click();
								})()`,
								"key": "key_browserConsole"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_responsiveDesignMode",
								"data-l10n-id": "responsive_design_mode",
								"oncommand": `(function() {
									var target = document.querySelector("#menu_responsiveUI");
									target && target.click();
								})()`,
								"key": "key_responsiveDesignMode"
							}),
							elm("xul:menuseparator"),
							// charset menu is included from a foreign source (conditional compilation)
							elm("xul:menuitem", {
								"data-l10n-id": "work_offline",
								"type": "checkbox",
								"observes": "workOfflineMenuitemState",
								"oncommand": "BrowserOffline.toggleOflineStatus();"
							})
						])
					]),
					elm("xul:menuseparator", {"class": "appmenu-menuseparator"}),
					elm("xul:menuitem", {
						"id": "appmenu_fullScreen",
						"class": "menuitem-tooltip",
						"data-l10n-id": "enter_fullscreen",
						"type": "checkbox",
						"observes": "View:FullScreen",
						"key": "key_enterFullScreen"
					}),
					elm("xul:menuitem", {
						"id": "appmenu-quit",
						"class": "menuitem-iconic",
						"data-l10n-id": "quit",
						"oncommand": "Services.startup.quit(Ci.nsIAppStartup.eAttemptQuit)"
					}),
					elm("xul:menuseparator", {"class": "appmenu-menuseparator", "hidden": "true"}),
					elm("xul:menuitem", {
						"id": "appmenu-echelon-update",
						"class": "menuitem-iconic",
						"data-l10n-id": "echelon_update_available",
						"oncommand": "Services.startup.quit(Ci.nsIAppStartup.eAttemptQuit)",
						"hidden": "true"
					})
				]),
				elm("xul:vbox", {id: "appmenuSecondaryPane"}, [
					splitmenu(
						{
							"id": "appmenu_bookmarks",
							"iconic": "true",
							"data-l10n-id": "bookmarks",
							"command": "Browser:ShowAllBookmarks",
							menupopupParams: {
								"id": "appmenu_bookmarksPopup",
								"placespopup": "true",
								"context": "placesContext",
								"openInTabs": "children",
								"onmouseup": "BookmarksEventHandler.onMouseUp(event);",
								"oncommand": "BookmarksEventHandler.onCommand(event);",
								"onclick": "BookmarksEventHandler.onClick(event);",
								"onpopupshowing": `if (!this.parentNode._placesView)
													new PlacesMenu(event, 'place:parent=${PlacesUtils.bookmarks.menuGuid}');`,
								"tooltip": "bhTooltip",
								"popupsinherittooltip": "true"
							}
						},
						[
							elm("xul:menuitem", {
								"id": "appmenu_showAllBookmarks",
								"data-l10n-id": "show_all_bookmarks",
								"command": "Browser:ShowAllBookmarks",
								"context": "",
								"key": "manBookmarkKb"
							}),
							elm("xul:menuseparator"),
							elm("xul:menuitem", {
								"class": "menuitem-iconic",
								"id": "appmenu_bookmarkThisPage",
								"data-l10n-id": "bookmark_this_page",
								"command": "Browser:AddBookmarkAs",
								"key": "addBookmarkAsKb"
							}),
							elm("xul:menuseparator"),
							elm("xul:menu", {
								"id": "appmenu_bookmarksToolbar",
								"data-l10n-id": "bookmarks_toolbar",
								"class": "menu-iconic bookmark-item",
								"placesanonid": "toolbar-autohide",
								"container": "true"
							}, [
								elm("xul:menupopup", {
									"id": "appmenu_bookmarksToolbarPopup",
									"placespopup": "true",
									"context": "placesContext",
									"onpopupshowing": `if (!this.parentNode._placesView)
															new PlacesMenu(event, 'place:parent=${PlacesUtils.bookmarks.toolbarGuid}');`
								})
							]),
							elm("xul:menuseparator"),
							//  items  //
							elm("xul:menuseparator", {
								"builder": "end",
								"class": "hide-if-empty-places-result",
								// "afterplacescontent" attribute required on modern Firefox
								"afterplacescontent": "true"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_unsortedBookmarks",
								"data-l10n-id": "unsorted_bookmarks",
								"oncommand": "PlacesCommandHook.showPlacesOrganizer('UnfiledBookmarks')",
								"class": "menuitem-iconic"
							})
						]
					),
					splitmenu(
						{
							"id": "appmenu_history",
							"iconic": "true",
							"data-l10n-id": "history",
							"command": "Browser:ShowAllHistory",
							menupopupParams: {
								"id": "appmenu_historyMenupopup",
								"placespopup": "true",
								"onmouseup": "BookmarksEventHandler.onMouseUp(event);",
								"oncommand": "this.parentNode._placesView._onCommand(event);",
								"onclick": "checkForMiddleClick(this, event);",
								"onpopupshowing": `if (!this.parentNode._placesView)
													new HistoryMenu(event);`,
								"tooltip": "bhTooltip",
								"popupsinherittooltip": "true"
							}
						},
						[
							elm("xul:menuitem", {
								"id": "appmenu_showAllHistory",
								"data-l10n-id": "show_all_history",
								"command": "Browser:ShowAllHistory",
								"key": "showAllHistoryKb"
							}),
							elm("xul:menuseparator"),
							elm("xul:menuitem", {
								"id": "appmenu_sanitizeHistory",
								"data-l10n-id": "clear_recent_history",
								"command": "Tools:Sanitize",
								"key": "key_sanitize"
							}),
							elm("xul:menuseparator", {
								"class": "hide-if-empty-places-result",
							}),
							elm("xul:menuitem", {
								"id": "appmenu_restoreLastSession",
								"class": "restoreLastSession",
								"data-l10n-id": "restore_last_session",
								"command": "Browser:RestoreLastSession"
							}),
							// These don't work??? needs to be looked into
							elm("xul:menu", {
								"id": "appmenu_recentlyClosedTabsMenu",
								"class": "recentlyClosedTabsMenu",
								"data-l10n-id": "recently_closed_tabs",
								"disabled": "true"
							}, [
								elm("xul:menupopup", {
									"placespopup": "true",
									"onpopupshowing": "document.getElementById('appmenu_recentlyClosedTabsMenu')._placesView.populateUndoSubmenu();)"
								})
							]),
							elm("xul:menu", {
								"id": "appmenu_recentlyClosedWindowsMenu",
								"class": "recentlyClosedWindowsMenu",
								"data-l10n-id": "recently_closed_windows",
								"disabled": "true"
							}, [
								elm("xul:menupopup", {
									"placespopup": "true",
									"onpopupshowing": "document.getElementById('appmenu_recentlyClosedWindowsMenu')._placesView.populateUndoWindowSubmenu();)"
								})
							]),
							elm("xul:menuseparator")
						]
					),
					elm("xul:menuitem", {
						"id": "appmenu_downloads",
						"class": "menuitem-tooltip",
						"data-l10n-id": "downloads",
						"command": "Tools:Downloads",
						"key": "key_openDownloads"
					}),
					elm("xul:spacer", { "id": "appmenuSecondaryPane-spacer" }),
					elm("xul:menuitem", {
						"id": "appmenu_addons",
						"class": "menuitem-iconic menuitem-iconic-tooltip",
						"data-l10n-id": "addons",
						"command": "Tools:Addons",
						"key": "key_openAddons"
					}),
					splitmenu(
						{
							"id": "appmenu_customize",
							"data-l10n-id": "options",
							"oncommand": "openPreferences();",
							menupopupParams: {
								"id": "appmenu_customizeMenu",
								"onpopupshowing": "onViewToolbarsPopupShowing(event, document.getElementById('appmenu_toggleTabsOnTop').previousSibling);"
							}
						},
						[
							elm("xul:menuitem", {
								"id": "appmenu_preferences",
								"data-l10n-id": "options",
								"oncommand": "openPreferences();"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_echelonOptions",
								"data-l10n-id": "echelon_options",
								"oncommand": "launchEchelonOptions()"
							}),
							elm("xul:menuseparator"),
							elm("xul:menuseparator"),
							elm("xul:menuitem", {
								"id": "appmenu_toggleTabsOnTop",
								"data-l10n-id": "tabs_on_top",
								"type": "checkbox",
								"oncommand": "g_echelonLayoutManager.setTabsOnTop(Boolean(this.getAttribute('checked')))"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_toolbarLayout",
								"data-l10n-id": "toolbar_layout",
								"command": "cmd_CustomizeToolbars"
							})
						]
					),
					splitmenu(
						{
							"id": "appmenu_help",
							"data-l10n-id": "help",
							"oncommand": "openHelpLink('firefox-help')"
						},
						[
							elm("xul:menuitem", {
								"id": "appmenu_openHelp",
								"data-l10n-id": "help",
								"oncommand": "openHelpLink('firefox-help')",
								"onclick": "checkForMiddleClick(this, event);"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_gettingStarted",
								"data-l10n-id": "getting_started",
								"oncommand": "gBrowser.loadOneTab('http://www.mozilla.com/firefox/central/', {inBackground: false});",
								"onclick": "checkForMiddleClick(this, event);"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_troubleshootingInfo",
								"data-l10n-id": "troubleshooting_info",
								"oncommand": "openTroubleshootingPage()",
								"onclick": "checkForMiddleClick(this, event);"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_feedbackPage",
								"data-l10n-id": "submit_feedback",
								"oncommand": "openFeedbackPage()",
								"onclick": "checkForMiddleClick(this, event);"
							}),
							elm("xul:menuseparator"),
							elm("xul:menuitem", {
								"id": "appmenu_safeMode",
								"data-l10n-id": "safe_mode",
								"oncommand": "safeModeRestart()"
							}),
							elm("xul:menuseparator"),
							elm("xul:menuitem", {
								"id": "appmenu_about",
								"data-l10n-id": "about",
								"oncommand": "openAboutDialog()"
							})
						]
					)
				])
			]);
			
			this.menuEl.appendChild(elementSet);
			parent.appendChild(this.menuEl);

			this.updateStrings();
			this.menuEl.addEventListener("popupshowing", this.updateStrings.bind(this));
			this.initialized = true;
		}

		updateStrings()
		{
			let style = PrefUtils.tryGetIntPref("Echelon.Appearance.Style");
			let locale = Services.locale.requestedLocale;
			if (!this.initialized || this.style != style || this.locale != locale)
			{
				this.strings = Services.strings.createBundle("chrome://echelon/locale/properties/appmenu.properties");
				(this.style != style) && (this.style = style);
				(this.locale != locale) && (this.locale = locale);

				/* Update Private Browsing and Send Link item labels */
				let privateBrowsing = this.menuEl.querySelector("#appmenu_privateBrowsing");
				if (privateBrowsing)
				{
					privateBrowsing.dataset.l10nId = (this.style >= 3) ? "private_browsing_new" : "private_browsing";
				}
				let sendLink = this.menuEl.querySelector("#appmenu_sendLink");
				if (sendLink)
				{
					sendLink.dataset.l10nId = (this.style >= 3) ? "send_link_new" : "send_link";
				}

				for (const elm of this.menuEl.querySelectorAll("[data-l10n-id]"))
				{
					let label = null;
					try
					{
						label = this.strings.GetStringFromName(elm.dataset.l10nId);
					}
					catch (e) {}

					if (label)
					{
						switch (elm.localName)
						{
							case "menu":
							case "menuitem":
								elm.label = label;
								break;
							case "toolbarbutton":
								elm.tooltipText = label;
								break;
							/* Split menu */
							case "hbox":
								elm.querySelector("label.menu-iconic-text").value = label;
								break;
						}
					}
				}

				let aboutDialog = this.menuEl.querySelector("#appmenu_about");
				if (aboutDialog)
				{
					aboutDialog.label = this.strings.formatStringFromName("about", [BrandUtils.getBrandingKey("brandShortName")]);
				}
			}
		}
		
		/**
		 * Renders the split menu element.
		 *
		 * The implementation details are roughly copied from the legacy XBL code from Firefox 4's
		 * browser/base/content/urlbarBindings.xml.
		 */
		renderSplitMenu(primaryItem, menuItems)
		{
			const elm = renderElement;
			
			primaryItem["class"] = primaryItem["class"]
				? primaryItem["class"] + " splitmenu-menuitem"
				: "splitmenu-menuitem";
			
			let menupopupParams = primaryItem.menupopupParams || {};
			delete primaryItem.menupopupParams;
			
			let primaryItemEl = 
				elm("xul:hbox", primaryItem, [
					elm("xul:hbox", {
						"class": "menu-iconic-left",
						"align": "center",
						"pack": "center",
						"aria-hidden": "true"
					}, 
					[
						elm("xul:image", {
							"class": "menu-iconic-icon"
						})
					]
					),
					elm("xul:label", {
						"class": "menu-iconic-text", 
						"flex": "1",
						"crop": "end",
						"aria-hidden": "true"
					})
				]);
				
			primaryItemEl.addEventListener("click", function(e) {
				if (this.getAttribute("oncommand"))
				{
					eval(this.getAttribute("oncommand"));
				}
			});
			
			let result = elm("echelon-splitmenu", {"class": "echelon-splitmenu"}, [
				primaryItemEl,
				elm("xul:menu", {
					"class": "splitmenu-menu",
					// Prevents clicking the menu expander from closing the app menu.
					"onclick": "event.stopPropagation();"
				}, [
					elm("xul:menupopup", menupopupParams, menuItems)
				])
			]);
			
			return result;
		}
		
		onUpdateTabsOnTop(state)
		{
			let tabsOnTopButton = this.menuEl.querySelector("#appmenu_toggleTabsOnTop");
			
			if (state == true)
			{
				tabsOnTopButton.setAttribute("checked", "true");
			}
			else
			{
				tabsOnTopButton.removeAttribute("checked");
			}
		}
	}

	g_echelonFirefoxButton = new FirefoxButton();
}