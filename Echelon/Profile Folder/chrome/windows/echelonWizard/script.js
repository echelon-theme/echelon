let currentPage = 0; // Default to the first page

// ECHELON SETTINGS
let echelonAppearanceBlue = "Echelon.Appearance.Blue";
let echelonAppearanceStyle = "Echelon.Appearance.Style";
let echelonParameterisFirstRunFinished = "Echelon.parameter.isFirstRunFinished";

let setBoolPref = Services.prefs.setBoolPref;
let setIntPref = Services.prefs.setIntPref;

function showPage(pageNumber) {
    var pageId = 'page' + pageNumber;
    var selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        // Hide all pages
        var pages = document.querySelectorAll('.page');
        for (var i = 0; i < pages.length; i++) {
            pages[i].style.display = 'none';
        }

        // Show the selected page
        selectedPage.style.display = 'flex';
        currentPage = pageNumber; // Update the currentPage variable
    } else {
        console.error('Page not found: ' + pageId);
    }
    
}

showPage(currentPage);

var restartNow = document.getElementById('restartNow');
restartNow.addEventListener("click", function() {
	
	setBoolPref(echelonParameterisFirstRunFinished, true);
	
    _ucUtils.restart(true);
}); 