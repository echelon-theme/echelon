document.querySelectorAll(".modal").forEach(modal => {
    modal.visibility = function(aValue) {
        if (aValue == "show") {
            modal.parentElement.removeAttribute("hidden");
        }
        else {
            modal.parentElement.setAttribute("hidden", "true");
        }
    }
});

window.addEventListener('load', () => {
    let modals = document.querySelectorAll('[data-modal]');

	modals.forEach(modal => {
		modal.parentElement.setAttribute("hidden", "true");
	});
});