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