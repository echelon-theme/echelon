var addStatusbar = {
    init: function () {	
        if (location != 'chrome://browser/content/browser.xhtml')
            return;

        try {
            if (gBrowser.selectedBrowser.getAttribute('blank')) gBrowser.selectedBrowser.removeAttribute('blank');
        } catch (e) { }

        try {
            if (document.getElementById('statusbarContainer') == null) {
                var statusbarContainer = document.createElement('vbox');
                statusbarContainer.id = 'statusbarContainer';
                document.getElementById('browser').parentNode.appendChild(statusbarContainer);

                var statusBar = document.createElement('div');
                statusBar.id = 'statusBar';
                statusbarContainer.appendChild(statusBar);
	
                var statusBarStatusLabel = document.createElement('label');
                statusBarStatusLabel.id = 'statusBarStatusLabel';

            }
        } catch (e) { }
    }
}
document.addEventListener('DOMContentLoaded', addStatusbar.init(), false);