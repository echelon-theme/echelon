// ==UserScript==
// @name			Echelon :: Appmenu
// @description 	Adds back appmenu (Firefox menu) functionality.
// @author			Travis, ephemeralViolette
// @include			main
// ==/UserScript==

let g_echelonFirefoxButton = null;

{
	var { PrefUtils, BrandUtils, renderElement } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
	renderElement = renderElement.bind(window);

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
		
		constructor()
		{
			try
			{
				let useCustomStyle = PrefUtils.tryGetBoolPref("Echelon.FirefoxButton.CustomStyle");

				//
				// 	Custom Firefox Button name & background color
				//
				if (useCustomStyle)
				{
					let fxButtonBgColor = PrefUtils.tryGetStringPref("Echelon.FirefoxButton.CustomBGColor");
						
					let root = document.documentElement;
					root.setAttribute("custom-fx-button-bg", "true");
					
					let styleElement = document.createElement('style');
					document.head.appendChild(styleElement);

					styleElement.innerHTML = `
						:root {
							--fx-custom-bg: `+ fxButtonBgColor + `;
						}
					`;
				}
				
				//
				// Button creation and insertion
				//
				let titlebarEl = document.getElementById("titlebar");
				let browserName = BrandUtils.getShortProductName();

				if (useCustomStyle)
				{
					browserName = PrefUtils.tryGetStringPref("Echelon.FirefoxButton.CustomName");
					if (browserName === "")
					{
						browserName = BrandUtils.getShortProductName();
					}
				}
				
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
				
				titlebarEl.insertBefore(this.appMenuButtonContainerEl, titlebarEl.firstChild);
				this.appMenuButtonContainerEl.appendChild(this.appMenuButtonEl);
				
				//
				// Creates the Firefox menu contents.
				//
				this.initMenu(this.appMenuButtonEl);
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
							"label": "New Tab",
							"onclick": "BrowserOpenTab()"
						},
						[
							elm("xul:menuitem", {
								"id": "appmenu_newTab_popup",
								"label": "New Tab",
								"command": "cmd_newNavigatorTab",
								"key": "key_newNavigatorTab"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_newNavigator",
								"label": "New Window",
								"command": "cmd_newNavigator",
								"key": "key_newNavigator"
							}),
							elm("xul:menuseparator"),
							elm("xul:menuitem", {
								"id": "appmenu_openFile",
								"label": "Open File...",
								"command": "Browser:OpenFile",
								"key": "openFileKb"
							})
						]
					),
					elm("xul:menuitem", {
						"id": "appmenu_privateBrowsing",
						"class": "menuitem-iconic menu-item-iconic-tooltip",
						"label": "Start Private Browsing",
						"command": "Tools:PrivateBrowsing",
						"key": "key_privatebrowsing"
					}),
					elm("xul:menuseparator", {"class": "appmenu-menuseparator"}),
					elm("xul:hbox", {}, [
						elm("xul:menuitem", {
							"id": "appmenu-edit-label",
							"label": "Edit",
							"disabled": "true"
						}),
						elm("xul:toolbarbutton", {
							"id": "appmenu-cut",
							"class": "appmenu-edit-button",
							"command": "cmd_cut",
							"onclick": "if (!this.disabled) hidePopup();",
							"tooltiptext": "Cut"
						}),
						elm("xul:toolbarbutton", {
							"id": "appmenu-copy",
							"class": "appmenu-edit-button",
							"command": "cmd_copy",
							"onclick": "if (!this.disabled) hidePopup();",
							"tooltiptext": "Copy"
						}),
						elm("xul:toolbarbutton", {
							"id": "appmenu-paste",
							"class": "appmenu-edit-button",
							"command": "cmd_paste",
							"onclick": "if (!this.disabled) hidePopup();",
							"tooltiptext": "Paste"
						}),
						elm("xul:spacer", {"flex": "1"}),
						elm("xul:menu", {"id": "appmenu-editmenu"}, [
							elm("xul:menupopup", {"id": "appmenu-editmenu-menupopup"}, [
								elm("xul:menuitem", {
									"id": "appmenu-editmenu-cut",
									"class": "menuitem-iconic",
									"label": "Cut",
									"key": "key_cut",
									"command": "cmd_cut"
								}),
								elm("xul:menuitem", {
									"id": "appmenu-editmenu-copy",
									"class": "menuitem-iconic",
									"label": "Copy",
									"key": "key_copy",
									"command": "cmd_copy"
								}),
								elm("xul:menuitem", {
									"id": "appmenu-editmenu-paste",
									"class": "menuitem-iconic",
									"label": "Paste",
									"key": "key_paste",
									"command": "cmd_paste"
								}),
								elm("xul:menuseparator", {"class": "appmenu-menuseparator"}),
								// These following buttons don't have icons.
								elm("xul:menuitem", {
									"id": "appmenu-editmenu-undo",
									"label": "Undo",
									"key": "key_undo",
									"command": "cmd_undo"
								}),
								elm("xul:menuitem", {
									"id": "appmenu-editmenu-redo",
									"label": "Redo",
									"key": "key_redo",
									"command": "cmd_redo"
								}),
								elm("xul:menuseparator", {"class": "appmenu-menuseparator"}),
								elm("xul:menuitem", {
									"id": "appmenu-editmenu-selectAll",
									"label": "Select All",
									"key": "key_selectAll",
									"command": "cmd_selectAll"
								}),
								elm("xul:menuseparator", {"class": "appmenu-menuseparator"}),
								elm("xul:menuitem", {
									"id": "appmenu-editmenu-delete",
									"label": "Delete",
									"key": "key_delete",
									"command": "cmd_delete"
								})
							])
						])
					]),
					elm("xul:menuitem", {
						"id": "appmenu_find",
						"class": "menuitem-tooltip",
						"label": "Find...",
						"command": "cmd_find",
						"key": "key_find"
					}),
					elm("xul:menuseparator", {"class": "appmenu-menuseparator"}),
					elm("xul:menuitem", {
						"id": "appmenu_savePage",
						"class": "menuitem-tooltip",
						"label": "Save Page As...",
						"command": "Browser:SavePage",
						"key": "key_savePage"
					}),
					elm("xul:menuitem", {
						"id": "appmenu_sendLink",
						"label": "Send Link...",
						"command": "Browser:SendLink"
					}),
					splitmenu(
						{
							"id": "appmenu_print",
							"label": "Print",
							"iconic": "true",
							"command": "cmd_print"
						},
						[
							elm("xul:menuitem", {
								"id": "appmenu_print_popup",
								"label": "Print",
								"command": "cmd_print",
								"key": "printKb"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_printSetup",
								"label": "Page Setup...",
								"command": "cmd_pageSetup"
							})
						]
					),
					elm("xul:menuseparator", {"class": "appmenu-menuseparator"}),
					elm("xul:menu", {
						"id": "appmenu_webDeveloper",
						"label": "Web Developer"
					}, [
						elm("xul:menupopup", {"id": "appmenu_webDeveloper_popup"}, [
							// elm("xul:menuitem", {
								// "id": "appmenu_webConsole",
								// "label": "Web Console",
								// "oncommand": "HUDConsoleUI.toggleHUD();",
								// "key": "key_browserConsole"
							// }),
							elm("xul:menuitem", {
								"id": "appmenu_pageInspect",
								"label": "Inspect Element",
								"oncommand": `(function() {
									var target = document.querySelector("#menu_devToolbox");
									target && target.click();
								})()`,
								"key": "key_toggleToolbox"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_pageSource",
								"label": "View Page Source",
								"command": "View:PageSource",
								"key": "key_viewSource"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_browserToolbox",
								"label": "Browser Toolbox",
								"oncommand": `(function() {
									var target = document.querySelector("#menu_browserToolbox");
									target && target.click();
								})()`,
								"key": "key_browserToolbox"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_browserConsole",
								"label": "Browser Console",
								"oncommand": `(function() {
									var target = document.querySelector("#menu_browserConsole");
									target && target.click();
								})()`,
								"key": "key_browserConsole"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_responsiveDesignMode",
								"label": "Responsive Design Mode",
								"oncommand": `(function() {
									var target = document.querySelector("#menu_responsiveUI");
									target && target.click();
								})()`,
								"key": "key_responsiveDesignMode"
							}),
							elm("xul:menuseparator"),
							// charset menu is included from a foreign source (conditional compilation)
							elm("xul:menuitem", {
								"label": "Work Offline",
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
						"label": "Full Screen",
						"type": "checkbox",
						"observes": "View:FullScreen",
						"key": "key_enterFullScreen"
					}),
					elm("xul:menuitem", {
						"id": "appmenu-quit",
						"class": "menuitem-iconic",
						"label": "Exit",
						"oncommand": "BrowserTryToCloseWindow(event)"
					})
				]),
				elm("xul:vbox", {id: "appmenuSecondaryPane"}, [
					// elm("div", {}, [
						// document.createTextNode("secondary pane :3")
					// ]),
					splitmenu(
						{
							"id": "appmenu_bookmarks",
							"iconic": "true",
							"label": "Bookmarks",
							"command": "Browser:ShowAllBookmarks",
							menupopupParams: {
								"id": "appmenu_bookmarksPopup",
								"placespopup": "true",
								//"is": "places-popup",
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
								"label": "Show All Bookmarks",
								"command": "Browser:ShowAllBookmarks",
								"context": "",
								"key": "manBookmarkKb"
							}),
							elm("xul:menuseparator"),
							elm("xul:menuitem", {
								"class": "menuitem-iconic",
								"id": "appmenu_bookmarkThisPage",
								"label": "Bookmark This Page",
								"command": "Browser:AddBookmarkAs",
								"key": "addBookmarkAsKb"
							}),
							elm("xul:menuseparator"),
							elm("xul:menu", {
								"id": "appmenu_bookmarksToolbar",
								"label": "Bookmarks Toolbar",
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
								"label": "Unsorted Bookmarks",
								"oncommand": "PlacesCommandHook.showPlacesOrganizer('UnfiledBookmarks')",
								"class": "menuitem-iconic"
							})
						]
					),
					splitmenu(
						{
							"id": "appmenu_history",
							"iconic": "true",
							"label": "History",
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
								"label": "Show All History",
								"command": "Browser:ShowAllHistory",
								"key": "showAllHistoryKb"
							}),
							elm("xul:menuseparator"),
							elm("xul:menuitem", {
								"id": "appmenu_sanitizeHistory",
								"label": "Clear Recent History...",
								"command": "Tools:Sanitize",
								"key": "key_sanitize"
							}),
							elm("xul:menuseparator", {
								"class": "hide-if-empty-places-result",
							}),
							elm("xul:menuitem", {
								"id": "appmenu_restoreLastSession",
								"class": "restoreLastSession",
								"label": "Restore Previous Session",
								"command": "Browser:RestoreLastSession"
							}),
							// These don't work??? needs to be looked into
							elm("xul:menu", {
								"id": "appmenu_recentlyClosedTabsMenu",
								"class": "recentlyClosedTabsMenu",
								"label": "Recently Closed Tabs",
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
								"label": "Recently Closed Windows",
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
						"label": "Downloads",
						"command": "Tools:Downloads",
						"key": "key_openDownloads"
					}),
					elm("xul:spacer", { "id": "appmenuSecondaryPane-spacer" }),
					elm("xul:menuitem", {
						"id": "appmenu_addons",
						"class": "menuitem-iconic menuitem-iconic-tooltip",
						"label": "Add-ons",
						"command": "Tools:Addons",
						"key": "key_openAddons"
					}),
					splitmenu(
						{
							"id": "appmenu_customize",
							"label": "Options",
							"oncommand": "openPreferences();",
							menupopupParams: {
								"id": "appmenu_customizeMenu",
								"onpopupshowing": "onViewToolbarsPopupShowing(event, document.getElementById('appmenu_toggleTabsOnTop').previousSibling);"
							}
						},
						[
							elm("xul:menuitem", {
								"id": "appmenu_preferences",
								"label": "Options",
								"oncommand": "openPreferences();"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_echelonOptions",
								"label": "Echelon Options",
								"oncommand": "launchEchelonOptions()"
							}),
							elm("xul:menuseparator"),
							elm("xul:menuseparator"),
							elm("xul:menuitem", {
								"id": "appmenu_toggleTabsOnTop",
								"label": "Tabs on Top",
								"type": "checkbox",
								"oncommand": "g_echelonLayoutManager.setTabsOnTop(Boolean(this.getAttribute('checked')))"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_toolbarLayout",
								"label": "Toolbar Layout...",
								"command": "cmd_CustomizeToolbars"
							})
						]
					),
					splitmenu(
						{
							"id": "appmenu_help",
							"label": "Help",
							"oncommand": "openHelpLink('firefox-help')"
						},
						[
							elm("xul:menuitem", {
								"id": "appmenu_openHelp",
								"label": "Help",
								"oncommand": "openHelpLink('firefox-help')",
								"onclick": "checkForMiddleClick(this, event);"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_gettingStarted",
								"label": "Getting Started",
								"oncommand": "gBrowser.loadOneTab('http://www.mozilla.com/firefox/central/', {inBackground: false});",
								"onclick": "checkForMiddleClick(this, event);"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_troubleshootingInfo",
								"label": "Troubleshooting Information",
								"oncommand": "openTroubleshootingPage()",
								"onclick": "checkForMiddleClick(this, event);"
							}),
							elm("xul:menuitem", {
								"id": "appmenu_feedbackPage",
								"label": "Submit Feedback...",
								"oncommand": "openFeedbackPage()",
								"onclick": "checkForMiddleClick(this, event);"
							}),
							elm("xul:menuseparator"),
							elm("xul:menuitem", {
								"id": "appmenu_safeMode",
								"label": "Restart with Add-ons Disabled...",
								"oncommand": "safeModeRestart()"
							}),
							elm("xul:menuseparator"),
							elm("xul:menuitem", {
								"id": "appmenu_about",
								"label": `About ${BrandUtils.getShortProductName()}`,
								"oncommand": "openAboutDialog()"
							})
						]
					)
				])
			]);
			
			this.menuEl.appendChild(elementSet);
			parent.appendChild(this.menuEl);
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
				
			let label = primaryItem.label;
			delete primaryItem.label;
			
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
						"aria-hidden": "true",
						"value": label
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