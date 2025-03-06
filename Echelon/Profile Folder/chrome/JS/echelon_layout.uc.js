// ==UserScript==
// @name			Echelon :: Layout
// @description 	Manages Echelon custom layout stuff.
// @author			ephemeralViolette
// @include			main
// ==/UserScript==

let g_echelonLayoutManager;
	
{
	class LayoutManager
	{
		urlbarEl = null;
		lang = Services.locale.requestedLocale;
		
		async init()
		{
			let toolboxRoot = await waitForElement("#navigator-toolbox");
			toolboxRoot.addEventListener("customizationchange", this);
			toolboxRoot.addEventListener("aftercustomization", this);
			this.getFogPositionalValues();
			this.initURLBarWidth();
			this.refreshToolboxLayout();
			this.hookTabArrowScrollbox();

			this.titlebarElem = document.getElementById("titlebar");

			// add back titlebar element if removed
			if (!this.titlebarElem)
			{
				this.titlebarElem = document.createXULElement("vbox");
				this.titlebarElem.id = "titlebar";
	
				toolboxRoot.insertBefore(this.titlebarElem, toolboxRoot.firstChild);
				this.titlebarElem.appendChild(document.querySelector("#toolbar-menubar"));
				this.titlebarElem.appendChild(document.querySelector("#TabsToolbar"));
			}
			
			this.titlebarContent = document.createXULElement("hbox");
			this.titlebarContent.id = "titlebar-content";
			this.titlebarElem.insertBefore(this.titlebarContent, this.titlebarElem.firstChild);

			let tabsBox = await waitForElement("#tabbrowser-tabs");
			tabsBox.addEventListener("TabSelect", this.onTabSwitch.bind(this));

			this.initTabsOnTop();
		}
		
		initTabsOnTop()
		{
			try
			{
				this._applyTabsOnTopFromPrefs();
			}
			catch (e)
			{
				if (e.name == "NS_ERROR_UNEXPECTED") // preference does not exist
				{
					try
					{
						PrefUtils.trySetBoolPref("Echelon.Appearance.TabsOnTop", true);
					}
					catch (e) {}
				}
			}
			
			Services.prefs.addObserver("Echelon.Appearance.TabsOnTop", this._applyTabsOnTopFromPrefs.bind(this));
		}
		
		setTabsOnTop(state)
		{
			PrefUtils.trySetBoolPref("Echelon.Appearance.TabsOnTop", state);
			this._applyTabsOnTopState(state);
		}
		
		_applyTabsOnTopFromPrefs()
		{
			let newState = Services.prefs.getBoolPref("Echelon.Appearance.TabsOnTop");
			this._applyTabsOnTopState(newState);
		}
		
		/**
		 * Applies the user's tabs on top preference.
		 *
		 * If the tabs are on top, then they are static and their layout cannot be changed. If they are
		 * not on top, then tabs are a flexible toolbar via CustomizeUI.
		 */
		_applyTabsOnTopState(state)
		{
			/* Tabs on bottom is not supported on Australis. */
			let style = PrefUtils.tryGetIntPref("Echelon.Appearance.Style");
			if (style < ECHELON_LAYOUT_AUSTRALIS || state)
			{
				let tabsContainer = document.querySelector("#TabsToolbar");
				let menubarContainer = document.querySelector("#toolbar-menubar");
				document.querySelector("#titlebar").appendChild(menubarContainer);
				
				if (!tabsContainer)
				{
					console.log("???", document);
					return;
				}
				
				if (state == true)
				{
					document.querySelector("#titlebar").appendChild(tabsContainer);
					document.documentElement.setAttribute("tabs-on-top", "true");
				}
				else
				{
					document.querySelector("#PersonalToolbar").insertAdjacentElement("afterend", tabsContainer);
					document.documentElement.removeAttribute("tabs-on-top");
				}
				
				// In lieu of an actual global messaging system, we will just message directly to modules that need it:
				// (this should be cleaned up in the future)
				if (g_echelonFirefoxButton)
				{
					g_echelonFirefoxButton.onUpdateTabsOnTop(state);
				}
			}

			let menuitem = document.getElementById("toolbar-context-echelonTabsOnTop");
			if (menuitem)
			{
				if (state == true)
				{
					menuitem.setAttribute("checked", "true");
				}
				else
				{
					menuitem.removeAttribute("checked");
				}
			}
		}
		
		refreshToolboxLayout()
		{
			// Update reload button
			let reloadButtonEl;
			if (reloadButtonEl = document.querySelector("#stop-reload-button"))
			{
				// We need to figure out what the previous element is as well:
				let previousEl = null;
				
				if (reloadButtonEl.parentNode?.nodeName == "toolbarpaletteitem")
				{
					// Customise mode is active, so we need to hack around to resolve
					// the non-wrapped previous element.
					previousEl = reloadButtonEl.parentNode.previousSibling?.children[0];
				}
				else
				{
					previousEl = reloadButtonEl.previousSibling;
				}
				
				if (previousEl?.id == "urlbar-container")
				{
					previousEl.classList.add("unified-refresh-button");
					reloadButtonEl.classList.add("unified");
					Array.from(reloadButtonEl.children).forEach(elm => elm.classList.add("unified"));
					
					this.urlbarEl = previousEl;
				}
				else
				{
					// Previous element is not guaranteed to exist.
					this.urlbarEl?.classList.remove("unified-refresh-button");
					
					reloadButtonEl.classList.remove("unified");
					Array.from(reloadButtonEl.children).forEach(elm => elm.classList.remove("unified"));
				}
			}

			// Update back/forward button
			let backButtonel = document.querySelector("#back-button");
			let forwardButtonEl;
			if (forwardButtonEl = document.querySelector("#forward-button"))
			{
				// We need to figure out what the previous element is as well:
				let nextEl = null;
				
				if (forwardButtonEl.parentNode?.nodeName == "toolbarpaletteitem")
				{
					// Customise mode is active, so we need to hack around to resolve
					// the non-wrapped previous element.
					nextEl = forwardButtonEl.parentNode.nextSibling?.children[0];
				}
				else
				{
					nextEl = forwardButtonEl.nextSibling;
				}
				
				if (nextEl?.id == "urlbar-container")
				{
					nextEl.classList.add("unified-forward-button");

					backButtonel.classList.add("unified-with-urlbar");
					forwardButtonEl.classList.add("unified-with-urlbar");
					Array.from(forwardButtonEl.children).forEach(elm => elm.classList.add("unified"));
					
					this.urlbarEl = nextEl;
				}
				else
				{
					// Previous element is not guaranteed to exist.
					this.urlbarEl?.classList.remove("unified-forward-button");
					
					backButtonel.classList.remove("unified-with-urlbar");
					forwardButtonEl.classList.remove("unified-with-urlbar");
					Array.from(forwardButtonEl.children).forEach(elm => elm.classList.remove("unified"));
				}
			}
		}
		
		handleEvent(event)
		{
			switch (event.type)
			{
				case "aftercustomization":
				case "customizationchange":
					this.refreshToolboxLayout();
					break;
			}
		}

		onCustomizePopupShowing()
		{
			if (this.lang != Services.locale.requestedLocale)
			{
				this.lang = Services.locale.requestedLocale;
				strings = Services.strings.createBundle("chrome://echelon/locale/properties/menus.properties");
				let tabsOnTopItem = document.getElementById("toolbar-context-echelonTabsOnTop");
				if (tabsOnTopItem)
				{
					tabsOnTopItem.label = strings.GetStringFromName("tabs_on_top_label");
					tabsOnTopItem.accessKey = strings.GetStringFromName("tabs_on_top_accesskey");
				}
			}
		}

		onTabSwitch()
		{
			// This attribute is added in order to check in CSS if the tab is
			// currently being switched. This is done in order to disable or
			// enable certain animations.
			document.documentElement.setAttribute("echelon-tabchanging", "true");
			setTimeout(() => document.documentElement.removeAttribute("echelon-tabchanging"), 50);
		}

		/**
		 * We need this hack for Australis automatic tab scrolling (opening new tab, ctrl+num)
		 * to work correctly. Otherwise, it will be offset a few pixels into the tab.
		 * 
		 * This does not negatively affect any other theme, since it just uses a more accurate
		 * element for positioning instead of the clipped parent element.
		 */
		async hookTabArrowScrollbox()
		{
			async function scrollIntoView_hook()
			{
				return this.querySelector(".tab-background").scrollIntoView();
			}

			let arrowScrollbox = await waitForElement("#tabbrowser-arrowscrollbox");
			let ensureElementIsVisible_orig = arrowScrollbox.ensureElementIsVisible;

			/*
			 * Overriding this method of the arrow scrollbox is basically done
			 * to avoid having to register something like a mutation observer.
			 * 
			 * We can just record the arguments of this and install the main
			 * hook painlessly.
			 */
			arrowScrollbox.ensureElementIsVisible = function(element, aInstant) {
				element.scrollIntoView = scrollIntoView_hook;
				ensureElementIsVisible_orig.apply(arrowScrollbox, arguments);
			};
		}

		/**
		 * Appends a XUL element inside of the URLBar Container.
		 * 
		 * Starting from I believe 133, the URLBar got changed from an
		 * XUL element to an HTML element:
		 * https://github.com/mozilla/gecko-dev/commit/22d599d1607cf798100f87e1b25e3e4f7e247f87
		 * 
		 * This causes the width of it to be fucked. The fucker knew about
		 * this too and added extra code to manually add in the width. This
		 * wouldn't be a problem until it was time in adding the Firefox 10
		 * style and the unified URLBar.
		 * 
		 * The idea is to add a XUL element inside of the URLBar container
		 * With similar unified styling as the actual URLBar and get the width
		 * of the element and set it to the real URLBar element.
		 */
		initURLBarWidth()
		{
			let toolbar = gURLBar.textbox.closest("toolbar");

			if (toolbar) {
				let urlbar = gURLBar.textbox;
				let urlbarContainer = urlbar.parentElement;

				// Check if URLBar isn't a XUL element
				if (urlbar.nodeName != "hbox") {
					this.echelonURLBarElem = document.createXULElement("hbox");
					this.echelonURLBarElem.id = "echelon-urlbar-positioning";
					this.echelonURLBarElem.setAttribute("flex", "1");

					urlbarContainer.insertBefore(this.echelonURLBarElem, urlbarContainer.lastChild);

					let echelonURLBarObserver = new ResizeObserver(([entry]) => {
						gURLBar.textbox.style.setProperty(
							"--urlbar-echelon-width",
							(entry.borderBoxSize[0].inlineSize) + "px"
						);
					});

					// Observer the sizing of the custom element.
					echelonURLBarObserver.observe(this.echelonURLBarElem);

					// add attribute for styling purposes
					if (this.echelonURLBarElem) {
						urlbar.setAttribute("echelon-modified", "true");
						urlbar.querySelector("#urlbar-background").setAttribute("echelon-modified", "true");
					}
				}
			}
		}

		/**
		 * For some whatever reason on a version of Firefox after 115, z-index is bugged and
		 * cannot fix the overlaying of the Tabs Toolbar and Navigation Toolbar how it originally did
		 * in Firefox 29, causing the Tabs to have a 2px bottom border, and having the fog effect
		 * show above the Navigation Toolbar, too hard to explain honestly
		 */
		async getFogPositionalValues()
		{
			let titlebarElem = await waitForElement("#titlebar");
			let tabsToolbar = await waitForElement("#TabsToolbar");
			let navigatorToolbox = await waitForElement("#navigator-toolbox");

			let fogObserver = new ResizeObserver(([entry]) => {
				console.log(entry);
				navigatorToolbox.style.setProperty(
					"--fog-position",
					Math.round(entry.contentRect.bottom - (tabsToolbar.getBoundingClientRect().height / 2)) + "px"
				);
			});

			fogObserver.observe(titlebarElem);
		}
	}
	
	g_echelonLayoutManager = new LayoutManager;
	g_echelonLayoutManager.init();

	let strings = Services.strings.createBundle("chrome://echelon/locale/properties/menus.properties");
	
	waitForElement("#toolbar-context-menu").then((prefsItem) => {
		let echelonTabsOnTopItem = window.MozXULElement.parseXULToFragment(`
			<menuitem id="toolbar-context-echelonTabsOnTop"
						oncommand="g_echelonLayoutManager.setTabsOnTop(Boolean(this.getAttribute('checked')))"
						type="checkbox"
						label="${strings.GetStringFromName("tabs_on_top_label")}" 
						accesskey="${strings.GetStringFromName("tabs_on_top_accesskey")}"/>
			<menuseparator xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" id="tabsOnTopMenuSeparator"/>
		`);

		waitForElement("#toolbar-context-echelonOptions").then(e => {
			prefsItem.insertBefore(echelonTabsOnTopItem, e);

			let isTabsOnTop = PrefUtils.tryGetBoolPref("Echelon.Appearance.TabsOnTop");
			let contextMenuItem = document.querySelector("#toolbar-context-echelonTabsOnTop");
			if (contextMenuItem)
			{
				if (isTabsOnTop == true)
				{
					contextMenuItem.setAttribute("checked", "true");
				}
				else
				{
					contextMenuItem.removeAttribute("checked");
				}
			}
			contextMenuItem.parentNode.addEventListener("popupshowing", g_echelonLayoutManager.onCustomizePopupShowing);
		});
	});

	waitForElement("#titlebar").then(e => {
		waitForElement("#titlebar-content").then(e => {
			let echelonTitlebarButtonBox = window.MozXULElement.parseXULToFragment(`
				<spacer id="titlebar-spacer" flex="1"/>
				<hbox class="titlebar-buttonbox-container echelon-custom-buttonbox" skipintoolbarset="true">
					<hbox class="titlebar-buttonbox">
						<toolbarbutton class="titlebar-button titlebar-min" oncommand="window.minimize();" data-l10n-id="browser-window-minimize-button" tooltiptext="Minimize"></toolbarbutton>
						<toolbarbutton class="titlebar-button titlebar-max" oncommand="window.maximize();" data-l10n-id="browser-window-maximize-button" tooltiptext="Maximize"></toolbarbutton>
						<toolbarbutton class="titlebar-button titlebar-restore" oncommand="window.fullScreen ? BrowserCommands.fullScreen() : window.restore();" data-l10n-id="browser-window-restore-down-button" tooltiptext="Restore Down"></toolbarbutton>
						<toolbarbutton class="titlebar-button titlebar-close" command="cmd_closeWindow" data-l10n-id="browser-window-close-button" tooltiptext="Close"></toolbarbutton>
					</hbox>
				</hbox>
			`);
			e.appendChild(echelonTitlebarButtonBox);
		});
	});

	waitForElement(".titlebar-buttonbox-container").then(e => {
		for (const elem of document.querySelectorAll(".titlebar-buttonbox-container")) {
			let echelonPrivateBrowsing = window.MozXULElement.parseXULToFragment(`
				<hbox id="private-browsing-indicator-titlebar">
					<hbox class="private-browsing-indicator"/>
				</hbox>
			`);
			elem.insertBefore(echelonPrivateBrowsing, elem.querySelector(".titlebar-buttonbox"));
		};
	});

	waitForElement(".private-browsing-indicator-with-label").then(e => {
		for (const elem of document.querySelectorAll(".private-browsing-indicator-with-label")) {
			let echelonPrivateBrowsing = window.MozXULElement.parseXULToFragment(`
				<hbox class="private-browsing-indicator"/>
			`);
			elem.replaceWith(echelonPrivateBrowsing);
		}
	});
}
