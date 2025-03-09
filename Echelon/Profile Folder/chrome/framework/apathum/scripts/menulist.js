document.querySelectorAll(".menulist").forEach(menulist => {
    let dropdown = menulist.querySelector(".list");
    let firstItem = menulist.querySelector(".item");
    let defaultItem = menulist.querySelector(".item[selected]");
    let items = menulist.querySelectorAll(".item");
    let dropdownText = menulist.querySelector(".selected");

    if (!defaultItem) {
        dropdownText.textContent = firstItem.textContent;
        menulist.setAttribute("value", firstItem.getAttribute("value"));
        firstItem.setAttribute("selected", true);
    } else {
        dropdownText.textContent = defaultItem.textContent;
        menulist.setAttribute("value", defaultItem.getAttribute("value"));
        defaultItem.setAttribute("selected", true);
    }

    menulist.addEventListener("click", (e) => {
        let menuListBoundingRect = menulist.getBoundingClientRect();
        let dropdownBoundingRect = dropdown.getBoundingClientRect();

        dropdown.style.left = menuListBoundingRect.right - dropdownBoundingRect.width + "px";

        dropdown.style.top = menuListBoundingRect.height + menuListBoundingRect.y + "px";

        if (!menulist.hasAttribute("open")) 
        {
            document.querySelectorAll('.menulist[open="true"]').forEach(openMenu => {
                openMenu.removeAttribute("open");
            })

            menulist.setAttribute("open", true);
        } 
        else 
        {
            menulist.removeAttribute("open");
        }

        document.addEventListener("click", function() {
			menulist.removeAttribute("open");
		});

        e.stopPropagation();
    });

    items.forEach(item => {
        item.addEventListener("click", () => {
            items.forEach(item => {
                item.removeAttribute("selected");
            });

            menulist.setAttribute("value", item.getAttribute("value"));
            dropdownText.textContent = item.textContent;
            item.setAttribute("selected", true);
            item.dispatchEvent(new CustomEvent("echelon-menulist-command"));
            document.dispatchEvent(new CustomEvent("echelon-menulist-command"));
        })
    });

    menulist.setValue = function(value) {
        let selectedItem = menulist.querySelector(`.item[value="${value}"]`);
        if (selectedItem) {
            items.forEach(item => {
                item.removeAttribute("selected");
            });
            selectedItem.setAttribute("selected", true);
            menulist.setAttribute("value", value);
            dropdownText.textContent = selectedItem.textContent;
        }
    };
});

// {
//     window.addEventListener(
//         "echelonpopupshowing",
//         e => {
//             if (e.originalTarget.ownerDocument != document) {
//                 return;
//             }
// 
//             e.originalTarget.setAttribute("hasbeenopened", "true");
//             for (let el of e.originalTarget.querySelectorAll("echelon-menulist")) {
//                 el.render();
//             }
//         },
//         { capture: true }
//     );
// 
//     class EchelonMenulist extends MozElements.ButtonBase {
//         static get fragment() {
//             let frag = document.importNode(
//             MozXULElement.parseXULToFragment(`
//                     <label class="menulist-text"></label>
//                     <image class="dropdown-marker" />
//                 `),
//                 true
//             );
//             Object.defineProperty(this, "fragment", { value: frag });
//             return frag;
//         }
// 
//         get menulist() {
//             return this;
//         }
// 
//         get _hasRendered() {
//             return this.querySelector(":scope > .selected") != null;
//         }
//         
//         get _textNode() {
//             let node = this.querySelector(".menulist-text");
//             if (node) {
//             Object.defineProperty(this, "_textNode", { value: node });
//             }
//             return node;
//         }
// 
//         connectedCallback() {
//             if (this.delayConnectedCallback()) {
//               return;
//             }
// 
//             let panel = this.querySelector("echelon-panel");
//             if (panel && !panel.hasAttribute("hasbeenopened")) {
//                 return;
//             }
//       
//             this.render();
//         }
// 
//         render() {
//             if (this._hasRendered) {
//                 return;
//             }
// 
//             this.appendChild(this.constructor.fragment.cloneNode(true));
// 
//             this.addEventListener("click", this);
//         }
// 
//         on_click(event) {
//             if (event.button != 0) {
//                 return;
//             }
//         }
//     }
//     
//     customElements.define("echelon-menulist", EchelonMenulist);
// }