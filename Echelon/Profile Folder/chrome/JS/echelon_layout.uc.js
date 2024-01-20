// ==UserScript==
// @name			Echelon :: Layout
// @description 	Manages Echelon custom layout stuff.
// @author			ephemeralViolette
// @include			main
// ==/UserScript==

let echelonInitLayout;
let g_echelonLayoutManager;

(function() {
	
class LayoutManager
{
	urlbarEl = null;
	
	async init()
	{
		let toolboxRoot = await waitForElement("#navigator-toolbox");
		toolboxRoot.addEventListener("customizationchange", this);
		toolboxRoot.addEventListener("aftercustomization", this);
		this.refreshLayout();
	}
	
	refreshLayout()
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
	}
	
	handleEvent(event)
	{
		switch (event.type)
		{
			case "aftercustomization":
			case "customizationchange":
				this.refreshLayout();
				break;
		}
	}
}
	
echelonInitLayout = function()
{
	g_echelonLayoutManager = new LayoutManager;
	g_echelonLayoutManager.init();
};
	
})();