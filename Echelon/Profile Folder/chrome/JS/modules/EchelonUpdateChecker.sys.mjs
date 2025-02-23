/**
 * Provides a interface to check for updates and restart on update via GitHub.
 */

var { PrefUtils } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
var { _ucUtils } = ChromeUtils.importESModule("chrome://userchromejs/content/utils.sys.mjs");

export class EchelonUpdateChecker
{
    static DO_NOT_UPDATE_PREF = "Echelon.Option.NoUpdateChecks";
    static GITHUB_REPOSITORY = "echelon-theme/echelon";
    static GITHUB_REPOSITORY_BRANCH = "upper-echelon";
    static BUILD_FILE_PATH_REMOTE = "Echelon/Profile Folder/chrome/version.json";
    static BUILD_FILE_PATH_LOCAL = "chrome://userchrome/content/version.json";
    
    static #window = null;

    static setWindow(window)
    {
        this.#window = window;
    }

    static async checkForUpdate()
    {
    }
    
    static async #fetchRemoteBuildData()
    {
        let response = await fetch(
            `https://raw.githubusercontent.com/${this.GITHUB_REPOSITORY}/${this.GITHUB_REPOSITORY_BRANCH}/${this.BUILD_FILE_PATH_REMOTE}`, 
            { cache: "reload" }
        );
        if (response.status != 200)
        {
            throw new Error(`Remote server returned ${response.status} when attempting to get version.`);
        }

        let build = await response.json();

        return build;
    }

    static async #fetchLocalBuildData()
    {
        let response = await fetch(
            this.BUILD_FILE_PATH_LOCAL, 
            { cache: "reload" }
        );

        let build = await response.json();

        return build;
    }

    static async getBuildData(distrib) {
        let dataResponse = null;

        if (distrib == "local") {
            dataResponse = await this.#fetchLocalBuildData();
        } else if (distrib == "remote") {
            dataResponse = await this.#fetchLocalBuildData();
        }

        return dataResponse;
    }
}