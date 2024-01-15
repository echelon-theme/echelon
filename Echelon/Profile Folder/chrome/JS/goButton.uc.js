function createGoButton() {
    try {

        CustomizableUI.createWidget({
            id: "go-button",
			defaultArea: CustomizableUI.AREA_NAVBAR,
            removable: false,
            label: "Go",
            onCommand: function () {
                gURLBar.handleCommand(event);
            },
            onCreated: function (button) {
				return button
            },
        });
		
		document.getElementById("stop-reload-button").appendChild(document.getElementById("go-button"));
		
    }
    catch (e) {
        Components.utils.reportError(e);
    }
}