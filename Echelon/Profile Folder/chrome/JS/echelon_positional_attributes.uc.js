// ==UserScript==
// @name            Echelon :: Positional Attributes
// @description     Sets positional attributes on tabs
// @author          aubymori, Travis
// @include         main
// ==/UserScript==

customElements.get("tabbrowser-tab").prototype._mouseenter = function _mouseenter()
{
    if (this.hidden || this.closing)
    {
        return;
    }

    let tabContainer = this.container;
    let visibleTabs = gBrowser.visibleTabs;
    let tabIndex = visibleTabs.indexOf(this);

    if (this.selected)
    {
        tabContainer._handleTabSelect();
    }

    if (tabIndex == 0)
    {
        tabContainer._beforeHoveredTab = null;
    }
    else
    {
        let candidate = visibleTabs[tabIndex - 1];
        let separatedByScrollButton =
            tabContainer.getAttribute("overflow") == "true" &&
            candidate.pinned &&
            !this.pinned;
        if (!candidate.selected && !separatedByScrollButton)
        {
            tabContainer._beforeHoveredTab = candidate;
            candidate.setAttribute("beforehovered", "true");
        }
    }

    if (tabIndex == visibleTabs.length - 1)
    {
        tabContainer._afterHoveredTab = null;
    }
    else
    {
        let candidate = visibleTabs[tabIndex + 1];
        if (!candidate.selected)
        {
            tabContainer._afterHoveredTab = candidate;
            candidate.setAttribute("afterhovered", "true");
        }
    }

    tabContainer._hoveredTab = this;
    if (this.linkedPanel && !this.selected)
    {
        this.linkedBrowser.unselectedTabHover(true);
    }

    // Prepare connection to host beforehand.
    SessionStore.speculativeConnectOnTabHover(this);

    let tabToWarm = this;
    if (this.mOverCloseButton)
    {
        tabToWarm = gBrowser._findTabToBlurTo(this);
    }
    gBrowser.warmupTab(tabToWarm);
}

customElements.get("tabbrowser-tab").prototype._mouseleave = function _mouseleave()
{
    let tabContainer = this.container;
    if (tabContainer._beforeHoveredTab)
    {
        tabContainer._beforeHoveredTab.removeAttribute("beforehovered");
        tabContainer._beforeHoveredTab = null;
    }
    if (tabContainer._afterHoveredTab)
    {
        tabContainer._afterHoveredTab.removeAttribute("afterhovered");
        tabContainer._afterHoveredTab = null;
    }

    tabContainer._hoveredTab = null;
    if (this.linkedPanel && !this.selected)
    {
        this.linkedBrowser.unselectedTabHover(false);
    }
}

customElements.get("tabbrowser-tabs").prototype._setPositionalAttributes = function _setPositionalAttributes()
{
    let visibleTabs = gBrowser.visibleTabs;
    if (!visibleTabs.length)
    {
        return;
    }
    let selectedTab = this.selectedItem;
    let selectedIndex = visibleTabs.indexOf(selectedTab);

    if (this._beforeSelectedTab)
    {
        this._beforeSelectedTab.removeAttribute("beforeselected-visible");
    }

    if (this._afterSelectedTab)
    {
        this._afterSelectedTab.removeAttribute("afterselected-visible");
    }    

    if (selectedTab.closing || selectedIndex <= 0)
    {
        this._beforeSelectedTab = null;
        this._afterSelectedTab = null;
    }
    else
    {
        let beforeSelectedTab = visibleTabs[selectedIndex - 1];
        let afterSelectedTab = visibleTabs[selectedIndex + 1];
        let separatedByScrollButton =
            this.getAttribute("overflow") == "true" &&
            beforeSelectedTab.pinned &&
            !selectedTab.pinned;
        if (!separatedByScrollButton)
        {
            this._beforeSelectedTab = beforeSelectedTab;
            this._beforeSelectedTab.setAttribute(
                "beforeselected-visible",
                "true"
            );

            if (selectedTab.nextSibling && selectedTab.nextSibling.localName == "tab") {
                this._afterSelectedTab = afterSelectedTab;
                this._afterSelectedTab.setAttribute(
                    "afterselected-visible",
                    "true"
                );
            }
        }
    }

    this._firstTab?.removeAttribute("first-visible-tab");
    this._firstTab = visibleTabs[0];
    this._firstTab.setAttribute("first-visible-tab", "true");

    this._lastTab?.removeAttribute("last-visible-tab");
    this._lastTab = visibleTabs[visibleTabs.length - 1];
    this._lastTab.setAttribute("last-visible-tab", "true");

    this._firstUnpinnedTab?.removeAttribute("first-visible-unpinned-tab");
    this._firstUnpinnedTab = visibleTabs.find(t => !t.pinned);
    this._firstUnpinnedTab?.setAttribute(
        "first-visible-unpinned-tab",
        "true"
    );

    let hoveredTab = this._hoveredTab;
    if (hoveredTab)
    {
        hoveredTab._mouseleave();
    }
    hoveredTab = this.querySelector("tab:hover");
    if (hoveredTab)
    {
        hoveredTab._mouseenter();
    }

    // Update before-multiselected attributes.
    // gBrowser may not be initialized yet, so avoid using it
    for (let i = 0; i < visibleTabs.length - 1; i++)
    {
        let tab = visibleTabs[i];
        let nextTab = visibleTabs[i + 1];
        tab.removeAttribute("before-multiselected");
        if (nextTab.multiselected)
        {
            tab.setAttribute("before-multiselected", "true");
        }
    }
}