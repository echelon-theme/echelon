// ==UserScript==
// @name			Echelon :: Identity Box
// @description 	Restores the old identity box HTML
// @author			aubymori
// @include			main
// ==/UserScript==

let strings = Services.strings.createBundle("chrome://echelon/locale/properties/urlbar.properties");
let lang = Services.locale.requestedLocale;

{
    const IDENTITY_BOX_HTML = `
    <!-- Security Section -->
    <hbox id="identity-popup-security" class="identity-popup-section">
    <image id="identity-popup-icon"/>
    <vbox class="identity-popup-security-content" flex="1">

        <label when-connection="chrome" id="identity-popup-brandName" class="identity-popup-label" value=""/>

        <label when-connection="chrome" id="identity-popup-chromeLabel" class="identity-popup-label"></label>

        <label when-connection="secure secure-ev" id="identity-popup-connectedToLabel" class="identity-popup-label" value=""/>

        <label when-connection="not-secure" id="identity-popup-connectedToLabel2" class="identity-popup-label" value=""/>

        <label when-connection="secure secure-ev" id="identity-popup-content-host" class="identity-popup-description" value="" />

        <label when-connection="secure secure-ev" id="identity-popup-runByLabel" class="identity-popup-label" value=""/>

        <description when-connection="secure secure-ev" id="identity-popup-content-owner" class="identity-popup-description"></description>

        <description id="identity-popup-content-supplemental" class="identity-popup-description"></description>

        <description when-connection="secure secure-ev" id="identity-popup-content-verifier" class="identity-popup-description"></description>

        <hbox id="identity-popup-encryption" flex="1">
            <vbox>
                <image id="identity-popup-encryption-icon"/>
            </vbox>
            <description id="identity-popup-encryption-label" flex="1" class="identity-popup-description"></description>
        </hbox>




        <vbox class="identity-popup-security-connection" hidden="true">
            <hbox flex="1">
                <description class="identity-popup-connection-not-secure"
                            when-connection="not-secure secure-cert-user-overridden secure-custom-root cert-error-page https-only-error-page" data-l10n-id="identity-connection-not-secure"></description>
                <description class="identity-popup-connection-secure"
                            when-connection="secure secure-ev" data-l10n-id="identity-connection-secure"></description>
                <description when-connection="chrome" data-l10n-id="identity-connection-internal"></description>
                <description when-connection="file" data-l10n-id="identity-connection-file"></description>
                <description when-connection="extension" data-l10n-id="identity-extension-page"></description>
                <description class="identity-popup-connection-secure upgraded" when-httpsonlystatus="upgraded failed-sub"
                data-l10n-id="identity-https-only-connection-upgraded"></description>
            </hbox>
        </vbox>

        <vbox id="identity-popup-security-description" hidden="true">
            <description id="identity-popup-security-ev-content-owner"
                        when-connection="secure-ev"/>
            <description class="identity-popup-warning-box identity-popup-warning-gray"
                        when-mixedcontent="active-blocked" data-l10n-id="identity-active-blocked"></description>
            <description id="identity-popup-security-decription-custom-root"
                        class="identity-popup-warning-box identity-popup-warning-gray"
                        when-customroot="true" data-l10n-id="identity-custom-root"></description>
            <description class="identity-popup-warning-box identity-popup-warning-yellow"
                        when-mixedcontent="passive-loaded" data-l10n-id="identity-passive-loaded"></description>
            <description class="identity-popup-warning-box identity-popup-warning-yellow"
                        when-mixedcontent="active-loaded" data-l10n-id="identity-active-loaded"></description>
            <description class="identity-popup-warning-box identity-popup-warning-yellow"
                        when-ciphers="weak" data-l10n-id="identity-weak-encryption"></description>
        </vbox>

        <vbox id="identity-popup-security-httpsonlymode" when-httpsonlystatus="exception upgraded failed-top failed-sub" hidden="true">
            <label flex="1" data-l10n-id="identity-https-only-label"></label>
            <div>
                <menulist id="identity-popup-security-httpsonlymode-menulist"
                oncommand="gIdentityHandler.changeHttpsOnlyPermission();" sizetopopup="none">
                <menupopup>
                    <menuitem value="0" data-l10n-id="identity-https-only-dropdown-on" />
                    <menuitem value="1" data-l10n-id="identity-https-only-dropdown-off" />
                    <menuitem value="2" id="identity-popup-security-menulist-tempitem"
                    data-l10n-id="identity-https-only-dropdown-off-temporarily" />
                </menupopup>
                </menulist>
            </div>
            <vbox id="identity-popup-security-httpsonlymode-info">
                <description when-httpsonlystatus="exception" flex="1" data-l10n-id="identity-https-only-info-turn-on2">
                </description>
                <description when-httpsonlystatus="failed-sub" flex="1" data-l10n-id="identity-https-only-info-turn-off2">
                </description>
                <description when-httpsonlystatus="failed-top" flex="1" data-l10n-id="identity-https-only-info-no-upgrade">
                </description>
            </vbox>
        </vbox>

    </vbox>
    <button id="identity-popup-security-button"
            class="identity-popup-expander"
            when-connection="not-secure secure secure-ev secure-cert-user-overridden cert-error-page https-only-error-page"
            oncommand="gIdentityHandler.showSecuritySubView();" hidden="true"/>
    </hbox>
    `;

    const IDENTITY_BOX_FOOTER = `
        <button id="identity-popup-help-icon" oncommand="handleHelpCommand(event);" tooltiptext="How do I tell if my connection to a website is secure?" />
        <spacer flex="1" />
        <button id="identity-popup-more-info-echelon" data-l10n-id="identity-more-info-link-text" oncommand="gIdentityHandler.handleMoreInfoClick(event);"></button>
    `;

    var { waitForElement } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
    waitForElement = waitForElement.bind(this);

    waitForElement("#identity-popup-mainView").then(e => {
        let body = e.querySelector(".panel-subview-body");
        if (body)
        {
            body.remove();
            let box = MozXULElement.parseXULToFragment(IDENTITY_BOX_HTML);
            e.insertBefore(
                box,
                e.querySelector("#identity-popup-clear-sitedata-footer")
            );
            updateProtocal();
        }

        function updateProtocal() {
            if (lang != Services.locale.requestedLocale)
            {
                lang = Services.locale.requestedLocale;
                strings = Services.strings.createBundle("chrome://echelon/locale/properties/urlbar.properties");
            }

            let displayHost = null;
            let iData = null;
            let mainView = document.querySelector("#identity-popup-mainView");
            let encryptionLabel = null;

            mainView.querySelector("#identity-popup-content-supplemental").textContent = "";

            if (gIdentityHandler._uriHasHost) {
                encryptionLabel = strings.GetStringFromName("identity.unencrypted");
                displayHost = gIdentityHandler.getHostForDisplay();
                mainView.querySelector("#identity-popup-content-host").setAttribute("value", displayHost);
                mainView.querySelector("#identity-popup-connectedToLabel2").setAttribute("value", strings.GetStringFromName("identity.unverifiedsite2"));
            }

            if (gIdentityHandler._uriHasHost && gIdentityHandler._isSecureContext) {
                encryptionLabel = strings.GetStringFromName("identity.encrypted2");
                mainView.querySelector("#identity-popup-connectedToLabel").setAttribute("value", strings.GetStringFromName("identity.connectedTo"));
                mainView.querySelector("#identity-popup-runByLabel").setAttribute("value", strings.GetStringFromName("identity.runBy"));
                mainView.querySelector("#identity-popup-content-owner").setAttribute("value", strings.GetStringFromName("identity.unknown"));
                mainView.querySelector("#identity-popup-content-verifier").setAttribute("value", gIdentityHandler._identityIcon.tooltipText);
            }

            if (gIdentityHandler._uriHasHost && gIdentityHandler._isEV) {
                iData = gIdentityHandler.getIdentityData();
                let supplemental = "";

                mainView.querySelector("#identity-popup-content-owner").setAttribute("value", iData.subjectOrg);

                if (iData.city)
                    supplemental += iData.city + "\n";
                if (iData.state && iData.country)
                    supplemental += gNavigatorBundle.getFormattedString("identity.identified.state_and_country",
                                                                        [iData.state, iData.country]);
                else if (iData.state) // State only
                    supplemental += iData.state;
                else if (iData.country) // Country only
                    supplemental += iData.country;

                mainView.querySelector("#identity-popup-content-supplemental").textContent = supplemental;
            }

            if (gIdentityHandler._isSecureInternalUI) {
                let fullName = BrandUtils.getBrandingKey("brandShortName");
                let productName = BrandUtils.getBrandingKey("brandFullName");

                mainView.querySelector("#identity-popup-brandName").setAttribute("value", fullName);

                mainView.querySelector("#identity-popup-chromeLabel").textContent = strings.formatStringFromName("identity.chrome", [productName]);
            }

            mainView.querySelector("#identity-popup-encryption-label").textContent = encryptionLabel;
        }

        window.addEventListener("load", updateProtocal);
        window.addEventListener("TabAttrModified", updateProtocal);
    });

    waitForElement("#identity-popup-clear-sitedata-footer").then(e => {
        e.innerHTML = "";

        let footer = MozXULElement.parseXULToFragment(IDENTITY_BOX_FOOTER);

        e.appendChild(footer);
    });

    function handleHelpCommand(event) {
        openHelpLink("secure-connection");
    }
}