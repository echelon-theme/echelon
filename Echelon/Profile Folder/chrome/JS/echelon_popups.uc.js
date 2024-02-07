// ==UserScript==
// @name			Echelon :: Popups
// @description 	Manages arrows and transitions of popups
// @author			aubymori
// @include			main
// ==/UserScript==

{
    function maxSubtract(x, y)
    {
        return (x > y) ? (x - y) : (y - x);
    }

    /** 
     * getBoundingClientRect adjusted to remove any distortions
     * from CSS transforms.
     * 
     * https://stackoverflow.com/a/57876601
     */
    function adjustedBoundingRect(el)
    {
        if (!el) return new DOMRect(0, 0, 0, 0);
        let rect = el.getBoundingClientRect();
        let style = getComputedStyle(el);
        let tx = style.transform;
    
        if (tx)
        {
            let sx, sy, dx, dy;
            if (tx.startsWith("matrix3d("))
            {
                let ta = tx.slice(9,-1).split(/, /);
                sx = +ta[0];
                sy = +ta[5];
                dx = +ta[12];
                dy = +ta[13];
            }
            else if (tx.startsWith("matrix("))
            {
                let ta = tx.slice(7,-1).split(/, /);
                sx = +ta[0];
                sy = +ta[3];
                dx = +ta[4];
                dy = +ta[5];
            }
            else
            {
                return rect;
            }

            let to = style.transformOrigin;
            let x = rect.x - dx - (1 - sx) * parseFloat(to);
            let y = rect.y - dy - (1 - sy) * parseFloat(to.slice(to.indexOf(" ") + 1));
            let w = sx ? rect.width / sx : el.offsetWidth;
            let h = sy ? rect.height / sy : el.offsetHeight;
            return {
                x: x, y: y, width: w, height: h, top: y, right: x + w, bottom: y + h, left: x
            };
        } else {
            return rect;
        }
    }

    class EchelonPopupManager
    {
        static onPopupShowing(event)
        {
            let popup = event.target;

            /* Arrow popouts */
            if (popup.matches(`:is(panel, menupopup)[type="arrow"]`))
            {
                /* POPUP ARROW POSITION (FOR CSS TRANSITION) */

                let rect = adjustedBoundingRect(popup);
                let anchorRect = adjustedBoundingRect(popup.anchorNode);

                /* Part 1: vertical position */
                let p1 = (rect.top > anchorRect.top)
                ? "after"
                : "before";

                /* Part 2: horizontal position */
                let p2 = "end";
                if (maxSubtract(rect.left, anchorRect.left) < maxSubtract(rect.right, anchorRect.right))
                {
                    p2 = "start";
                }
                
                popup.setAttribute("arrowposition", `${p1}_${p2}`);

                /* POPUP ARROW IMAGE (FOR EXTENSION POPUPS) */
                let color = popup.style.getPropertyValue("--arrowpanel-background");
                if (color != "" && popup.style.getPropertyValue("--panel-arrow-image-vertical") == "")
                {
                    let panelBg = `url('data:image/svg+xml,${encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="10">
                    <path d="M 0,10 L 10,0 20,10 z"
                            fill="hsla(210,4%,10%,.2"/>
                    <path d="M 1,10 L 10,1 19,10 z"
                            fill="${color}"/>
                    </svg>
                    `)}')`;
                    popup.setAttribute("style", `${popup.getAttribute("style")}--panel-arrow-image-vertical: ${panelBg};`);
                }
            }
            /* Bookmarks menu shit */
            else if (popup.matches(`menupopup[type="arrow"] menupopup[placespopup]:not(#PlacesChevronPopup)`) && popup.anchorNode.nodeName == "menu")
            {
                let rect = adjustedBoundingRect(popup);
                let anchorRect = adjustedBoundingRect(popup.anchorNode);

                popup.setAttribute("side", (rect.left < anchorRect.left)
                ? "left"
                : "right");
            }
        }

        static registerEvent()
        {
            document.addEventListener("popupshowing", this.onPopupShowing);
        }
    }

    EchelonPopupManager.registerEvent();
}