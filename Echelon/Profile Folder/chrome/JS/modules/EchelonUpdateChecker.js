/**
 * Provides a interface to check for updates and restart on update via GitHub.
 */

this.EXPORTED_SYMBOLS = ["EchelonUpdateChecker"];

var { PrefUtils } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
var { _ucUtils } = ChromeUtils.importESModule("chrome://userchromejs/content/utils.sys.mjs");

class EchelonUpdateChecker
{
    static DO_NOT_UPDATE_PREF = "Echelon.Option.NoUpdateChecks";
    static LAST_LOADED_VER_PREF = "Echelon.parameter.lastLoadedVersion";
    static GITHUB_REPOSITORY = "echelon-theme/echelon";
    static GITHUB_REPOSITORY_BRANCH = "main";
    static BUILD_FILE_PATH_REMOTE = "Echelon/Profile Folder/chrome/build.txt";
    static BUILD_FILE_PATH_LOCAL = "chrome://userchrome/content/build.txt";

    static #window = null;

    static setWindow(window)
    {
        this.#window = window;
    }

    static async #getRemoteBuildNumber()
    {
        let response = await fetch(
            `https://raw.githubusercontent.com/${this.GITHUB_REPOSITORY}/${this.GITHUB_REPOSITORY_BRANCH}/${this.BUILD_FILE_PATH_REMOTE}`, 
            { cache: "reload" }
        );
        if (response.status != 200)
        {
            throw new Error(`Remote server returned ${response.status} when attempting to get version.`);
        }

        let buildText = await response.text();
        let build = Number(buildText);
        if (Number.isNaN(build) || !Number.isInteger(build) || build <= 0)
        {
            throw new Error(`Remote build number received (${buildText}) is not a positive integer.`);
        }

        return build;
    }

    static async #getLocalBuildNumber()
    {
        let response = await fetch(
            this.BUILD_FILE_PATH_LOCAL,
            { cache: "reload" }
        );

        let buildText = await response.text();
        let build = Number(buildText);
        if (Number.isNaN(build) || !Number.isInteger(build) || build <= 0)
        {
            throw new Error(`Local build number received (${buildText}) is not a positive integer.`);
        }

        return build;
    }

    static async checkForUpdate()
    {
        try
        {
            /* Update the last loaded version pref */
            let localBuildNumber = await this.#getLocalBuildNumber();
            let lastLoadedVersion = PrefUtils.tryGetIntPref(this.LAST_LOADED_VER_PREF);
            PrefUtils.trySetIntPref(this.LAST_LOADED_VER_PREF, localBuildNumber);

            /* Clear cache and restart if previous loaded version
               is not same. */
            if (localBuildNumber != lastLoadedVersion)
            {
                _ucUtils.restart(true);
            }

            if (PrefUtils.tryGetBoolPref(this.DO_NOT_UPDATE_PREF))
            {
                return;
            }

            let remoteBuildNumber = await this.#getRemoteBuildNumber();
            if (localBuildNumber < remoteBuildNumber)
            {
                let messageStruct = {
                    accepted: false,
                    icon: "info",
                    title: "Echelon: Update available",
                    message:
`An update for Echelon is available!

Current build: ${localBuildNumber}
New build: ${remoteBuildNumber}

Would you like to open the GitHub page for Echelon?
(You can disable the update checker from the Echelon Options window.)
`,
                    acceptButtonText: "Yes",
                    cancelButtonText: "No"
                };
                this.#window.openDialog(
                    "chrome://userchrome/content/windows/common/dialog.xhtml",
                    "Echelon: Update available",
                    "chrome,centerscreen,resizeable=no,dependent,modal",
                    messageStruct
                );

                if (messageStruct.accepted)
                {
                    this.#window.openURL(`https://github.com/${this.GITHUB_REPOSITORY}/tree/${this.GITHUB_REPOSITORY_BRANCH}`);
                }
            }
        }
        catch (error)
        {
            Components.utils.reportError(error);
            
            let errorStruct = {
                accepted: false,
                icon: "error",
                title: "Echelon: Failed to check for updates",
                message:
`Something went wrong and Echelon was unable to determine whether an update is available.

Error: ${error.message}`,
                acceptButtonText: "OK",
                cancelButtonText: "Disable"
            };
            this.#window.openDialog(
                "chrome://userchrome/content/windows/common/dialog.xhtml",
                "Echelon: Failed to check for updates",
                "chrome,centerscreen,resizeable=no,dependent,modal",
                errorStruct
            );

            if (!errorStruct.accepted)
            {
                PrefUtils.trySetBoolPref(this.DO_NOT_UPDATE_PREF, true);
            }
        }
    }
}
