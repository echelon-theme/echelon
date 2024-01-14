// ==UserScript==
// @name			Firefox Button
// @description 	Adds back Firefox button.
// @author			Travis
// @include			main
// ==/UserScript==


function createAppMenuButton() {
    try {
		let titleBar = document.getElementById("titlebar");
		let browserName = Services.appinfo.name;
		
		let appMenuButtonContainer = document.createXULElement("hbox");
		const appMenuButtonContainerAttr = {
			"id": "appmenu-button-container",
		}
		setAttributes(appMenuButtonContainer, appMenuButtonContainerAttr);
		
		let appMenuButton = document.createXULElement("button");
		const appMenuButtonAttr = {
			"id": "appmenu-button",
			"type": "menu",
			"label": browserName,
		}
		setAttributes(appMenuButton, appMenuButtonAttr);
		
		titleBar.insertBefore(appMenuButtonContainer, titleBar.firstChild);
		appMenuButtonContainer.appendChild(appMenuButton);
    }
    catch (e) {
        Components.utils.reportError(e);
    }
}

function setAttributes(element, attributes) {
	Object.keys(attributes).forEach(attr => {
		element.setAttribute(attr, attributes[attr]);
	});
}