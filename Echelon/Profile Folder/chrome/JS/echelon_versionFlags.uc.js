// ==UserScript==
// @name			 Echelon :: Version Flags
// @description 	 Adds checks for the browser version
// @author			 Travis
// @include			 main
// ==/UserScript==

let appVersion = AppConstants.MOZ_APP_VERSION;
let majorVersion = parseInt(appVersion.split(".")[0]);
let checkedVersions = [128, 133];
let versionFlags = {};

checkedVersions.forEach(version => {
	if (majorVersion >= version) {
		let flagName = `is${version}newer`;
		document.documentElement.setAttribute(flagName, true);
		versionFlags[flagName] = true;
	}
});