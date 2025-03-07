// ==UserScript==
// @name			Echelon :: Arrowpanels
// @description 	Adds arrows back to panels and places popups.
// @author			aubymori
// @include			main
// ==/UserScript==

{
    /* Arrow panels */
    let panel = customElements.get("panel");

    /* Redefine panelContent getter (this was not in Firefox 88) */
    Object.defineProperty(panel.prototype, "panelContent", {
        get: function()
        {
            return this.shadowRoot.querySelector("[part=innerarrowcontent]");
        }
    });

    /* Adds arrowposition attribute. */
    panel.prototype.adjustArrowPosition = function adjustArrowPosition(event)
    {
        if (!this.isArrowPanel)
        {
            return;
        }
    
        var container = this.shadowRoot.querySelector(".panel-arrowcontainer");
        var arrowbox = this.shadowRoot.querySelector(".panel-arrowbox");
    
        var position = event.alignmentPosition;
        var offset = event.alignmentOffset;
    
        this.setAttribute("arrowposition", position);
    
        if (position.indexOf("start_") == 0 || position.indexOf("end_") == 0)
        {
            container.setAttribute("orient", "horizontal");
            arrowbox.setAttribute("orient", "vertical");
            if (position.indexOf("_after") > 0)
            {
                arrowbox.setAttribute("pack", "end");
            }
            else
            {
                arrowbox.setAttribute("pack", "start");
            }
            arrowbox.style.transform = "translate(0, " + -offset + "px)";
    
            // The assigned side stays the same regardless of direction.
            var isRTL = window.getComputedStyle(this).direction == "rtl";
    
            if (position.indexOf("start_") == 0)
            {
                arrowbox.style.order = "1";
                this.setAttribute("side", isRTL ? "left" : "right");
            }
            else
            {
                arrowbox.style.removeProperty("order");
                this.setAttribute("side", isRTL ? "right" : "left");
            }
        }
        else if (
            position.indexOf("before_") == 0 ||
            position.indexOf("after_") == 0
        )
        {
            container.removeAttribute("orient");
            arrowbox.removeAttribute("orient");
            if (position.indexOf("_end") > 0)
            {
                arrowbox.setAttribute("pack", "end");
            }
            else
            {
                arrowbox.setAttribute("pack", "start");
            }
            arrowbox.style.transform = "translate(" + -offset + "px, 0)";
    
            if (position.indexOf("before_") == 0)
            {
                container.style.flexDirection = "column-reverse";
                this.setAttribute("side", "bottom");
            }
            else
            {
                container.style.removeProperty("flex-direction");
                this.setAttribute("side", "top");
            }
        }
    };

    /* What calls adjustArrowPosition */
    panel.prototype.on_popuppositioned = function on_popuppositioned(event)
    {
        if (event.target == this)
        {
            this.adjustArrowPosition(event);
        }
    };

    /* Fix positioning */
    function mapPosition(aPosition)
    {
        switch (aPosition)
        {
            case "bottomright topright":
                return "bottomcenter topright";
            case "bottomleft topleft":
                return "bottomcenter topleft";
            default:
                return aPosition;
        }
    }

    panel.prototype.openPopup = function openPopup(
        aAnchorElement,
        aOptions,
        aXPos, aYPos,
        aIsContextMenu, aAttributesOverride,
        aTriggerEvent
    )
    {
        if (typeof aOptions == "object" && aOptions?.position)
        {
            aOptions.position = mapPosition(aOptions.position);
        }
        else if (typeof aOptions == "string")
        {
            aOptions = mapPosition(aOptions);
        }

        /* Hack for the downloads autohide panel in customize mode */
        if (this.id == "downloads-button-autohide-panel")
        {
            switch (aOptions)
            {
                case "topleft topright":
                    aOptions = "leftcenter topright";
                    break;
                case "topright topleft":
                    aOptions = "rightcenter topleft";
                    break;
            }
        }

        return XULPopupElement.prototype.openPopup.call(
            this,
            aAnchorElement,
            aOptions,
            aXPos, aYPos,
            aIsContextMenu, aAttributesOverride,
            aTriggerEvent
        );
    }

    /* Places popups */
    let places = customElements.get("places-popup-arrow");

    /* Arrow HTML */
    Object.defineProperty(places.prototype, "markup", {
        get: function() {
            return `
            <html:link rel="stylesheet" href="chrome://global/skin/global.css"/>
            <vbox class="panel-arrowcontainer" flex="1">
                <box class="panel-arrowbox" part="arrowbox">
                    <image class="panel-arrow" part="arrow"/>
                </box>
                <box class="panel-arrowcontent" part="arrowcontent" flex="1">
                    <vbox part="drop-indicator-bar" hidden="true">
                    <image part="drop-indicator"/>
                    </vbox>
                    <arrowscrollbox class="menupopup-arrowscrollbox" flex="1"
                                    orient="vertical" smoothscroll="false"
                                    part="arrowscrollbox">
                    <html:slot/>
                    </arrowscrollbox>
                </box>
            </vbox>
            `;
        }
    });

    /* Some getters */
    Object.defineProperty(places.prototype, "container", {
        get: function()
        {
            return this.shadowRoot.querySelector(".panel-arrowcontainer");
        }
    });
    Object.defineProperty(places.prototype, "arrowbox", {
        get: function()
        {
            return this.shadowRoot.querySelector(".panel-arrowbox");
        }
    });
    Object.defineProperty(places.prototype, "arrow", {
        get: function()
        {
            return this.shadowRoot.querySelector(".panel-arrow");
        }
    });

    /* Adds arrowposition attribute */
    places.prototype.adjustArrowPosition = function adjustArrowPosition(event)
    {
        let arrow = this.arrow;
    
        let anchor = this.anchorNode;
        if (!anchor)
        {
            arrow.hidden = true;
            return;
        }
    
        let container = this.container;
        let arrowbox = this.arrowbox;
    
        var position = event.alignmentPosition;
        var offset = event.alignmentOffset;
    
        this.setAttribute("arrowposition", position);
    
        // if this panel has a "sliding" arrow, we may have previously set margins...
        arrowbox.style.removeProperty("transform");
        if (position.indexOf("start_") == 0 || position.indexOf("end_") == 0)
        {
            container.setAttribute("orient", "horizontal");
            arrowbox.setAttribute("orient", "vertical");
            if (position.indexOf("_after") > 0)
            {
                arrowbox.setAttribute("pack", "end");
            }
            else
            {
                arrowbox.setAttribute("pack", "start");
            }
            arrowbox.style.transform = "translate(0, " + -offset + "px)";
    
            // The assigned side stays the same regardless of direction.
            let isRTL = this.matches(":-moz-locale-dir(rtl)");
    
            if (position.indexOf("start_") == 0)
            {
                arrowbox.style.order = "1";
                this.setAttribute("side", isRTL ? "left" : "right");
            }
            else
            {
                container.style.removeProperty("order");
                this.setAttribute("side", isRTL ? "right" : "left");
            }
        }
        else if (
            position.indexOf("before_") == 0 ||
            position.indexOf("after_") == 0
        )
        {
            container.removeAttribute("orient");
            arrowbox.removeAttribute("orient");
            if (position.indexOf("_end") > 0)
            {
                arrowbox.setAttribute("pack", "end");
            }
            else
            {
                arrowbox.setAttribute("pack", "start");
            }
            arrowbox.style.transform = "translate(" + -offset + "px, 0)";
    
            if (position.indexOf("before_") == 0)
            {
                container.style.flexDirection = "column-reverse";
                this.setAttribute("side", "bottom");
            }
            else
            {
                container.style.removeProperty("flex-direction");
                this.setAttribute("side", "top");
            }
        }
    
        arrow.hidden = false;
    };

    /* What calls adjustArrowPosition */
    places.prototype.on_popuppositioned = function on_popuppositioned(event)
    {
        if (event.target == this)
        {
            this.adjustArrowPosition(event);
        }
    };
}