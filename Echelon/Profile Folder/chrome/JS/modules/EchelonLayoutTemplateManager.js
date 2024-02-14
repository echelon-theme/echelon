this.EXPORTED_SYMBOLS = ["EchelonLayoutTemplateManager"];

var { PrefUtils } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");

var EchelonLayoutTemplateManager = class EchelonLayoutTemplateManager
{
	static CustomizableUI = ChromeUtils.importESModule("resource:///modules/CustomizableUI.sys.mjs").CustomizableUI;

	static TOOLBAR_LAYOUT_TEMPLATE = [
		{
			id: "back-button",
			absolutePositionHint: 1,
			relativePositionHint: {
				"forward-button": "before"
			},
			positionStrength: "coerce-siblings",
			behavior: "add-if-not-existing",
			themeSpecificProperties: {
				// Australis
				4: {
					positionStrength: "strict"
				}
			}
		},
		{
			id: "forward-button",
			absolutePositionHint: 2,
			relativePositionHint: {
				"back-button": "after"
			},
			positionStrength: "coerce-siblings",
			behavior: "add-if-not-existing",
			themeSpecificProperties: {
				// Australis
				4: {
					positionStrength: "strict"
				}
			}
		},
		{
			id: "urlbar-container",
			absolutePositionHint: 3,
			relativePositionHint: {
				"forward-button": "after"
			},
			positionStrength: "ignore",
			behavior: "add-if-not-existing",
			themeSpecificProperties: {
				// Australis
				4: {
					positionStrength: "strict"
				}
			}
		},
		{
			id: "stop-reload-button",
			absolutePositionHint: 4,
			relativePositionHint: {
				"urlbar-container": "after"
			},
			positionStrength: "coerce-siblings",
			behavior: "add-if-not-existing",
			themeSpecificProperties: {
				// Australis
				4: {
					positionStrength: "strict"
				}
			}
		},
		{
			id: "search-container",
			behavior: "add-if-not-existing",
			absolutePositionHint: 5,
			relativePositionHint: {
				"stop-reload-button": "after",
				"urlbar-container": "after"
			}
		},
		{
			id: "home-button",
			behavior: "add-if-not-existing",
			absolutePositionHint: 6,
			relativePositionHint: {
				"search-container": "after"
			}
		},
		{
			id: "downloads-button",
			behavior: "add-if-not-existing",
			absolutePositionHint: 7,
			relativePositionHint: {
				"home-button": "after"
			}
		},
		{
			id: "bookmarks-button",
			behavior: "add-if-not-existing",
			relativePositionHint: {
				// These are counted one after another, so the first in the list
				// is the primary item to check
				"downloads-button": "after",
				"search-container": "after"
			}
		},
		{
			id: "bookmarks-menu-button",
			behavior: "add-if-not-existing",
			relativePositionHint: {
				"bookmarks-button": "after",
				"search-container": "after"
			}
		},
		// Items to be removed when applying the template:
		{
			id: "save-to-pocket-button",
			behavior: "remove"
		},
		{
			id: "library-button",
			behavior: "remove"
		},
		{
			// Firefox Account menu
			id: "fxa-toolbar-menu-button",
			behavior: "remove"
		},
		{
			// Padding before address box
			id: "customizableui-special-spring1",
			behavior: "remove"
		},
		{
			// Padding after address box
			id: "customizableui-special-spring2",
			behavior: "remove"
		}
	];

	static getPropertyList(templateItem)
	{
		let out = {};
		
		for (let key in templateItem)
		{
			out[key] = templateItem[key];
		}
		
		if (templateItem.themeSpecificProperties)
		{
			let version = PrefUtils.tryGetIntPref("Echelon.Appearance.Style", 0);
			
			if (templateItem.themeSpecificProperties[version])
			{
				for (let key in templateItem.themeSpecificProperties[version])
				{
					out[key] = templateItem.themeSpecificProperties[version][key];
				}
			}
		}
		
		return out;
	}

	/**
	 * Calculates the new position for an item.
	 *
	 * @return {number}
	 */
	static calculatePlacementForItem(itemProps)
	{
		let targetId = itemProps.id;
		
		if (itemProps.relativePositionHint)
		{
			for (let sibling in itemProps.relativePositionHint)
			{
				let siblingPosition;
				if (siblingPosition = this.CustomizableUI.getPlacementOfWidget(sibling))
				{
					switch (itemProps.relativePositionHint[sibling])
					{
						case "before":
							return siblingPosition.position - 1;
						case "after":
							return siblingPosition.position + 1;
						default:
							throw new Error("Invalid relative position hint value: " + itemProps.relativePositionHint[sibling]);
					}
				}
			}
		}
		
		if (itemProps.absolutePositionHint)
		{
			return itemProps.absolutePositionHint;
		}
		
		return 0;
	}

	static applyTemplateItemProps(props)
	{
		let id = props.id;
		let behavior = props.behavior ?? "add-if-not-existing";
		let targetArea = props.targetArea ?? "nav-bar";
		let alreadyExists = false;
		let existingPlacement = null;
		
		if (existingPlacement = this.CustomizableUI.getPlacementOfWidget(id))
		{
			alreadyExists = true;
		}
		
		switch (behavior)
		{
			// Adds an item in a specified position if it does not already exist.
			case "add-if-not-existing":
			{
				let position = this.calculatePlacementForItem(props);
				this.CustomizableUI.addWidgetToArea(id, targetArea, position);
				
				break;
			}
				
			// Removes an item from the toolbar if it exists.
			case "remove":
			{
				this.CustomizableUI.removeWidgetFromArea(id);
				
				break;
			}
			
			// Moves an item only if it already exists.
			case "move":
			{
				let position = this.calculatePlacementForItem(props);
				this.CustomizableUI.moveWidgetWithinArea(id, position);
				
				break;
			}
		}
	}

	static applyLayout(targetWindow = window, template = this.TOOLBAR_LAYOUT_TEMPLATE)
	{
		this.CustomizableUI.beginBatchUpdate();
		
		try
		{
			for (let i = 0; i < template.length; i++)
			{
				let item = template[i];
				let props = this.getPropertyList(item);
				this.applyTemplateItemProps(props);
			}
			
			// Fire this event so that our code dispatches to Echelon layout code.
			this.CustomizableUI.dispatchToolboxEvent("aftercustomization", {}, targetWindow);
		}
		finally
		{
			// This must be caught or a failure will break CustomizableUI forever (for the session).
			this.CustomizableUI.endBatchUpdate(true);
		}
	}

	static applyDefaultLayout(targetWindow = window)
	{
		this.applyLayout(targetWindow, this.TOOLBAR_LAYOUT_TEMPLATE);
	}
}