// ==UserScript==
// @name			Phroton :: Identity Box
// @description 	Restores the old identity box HTML
// @author			aubymori
// @include			main
// ==/UserScript==

{
    const IDENTITY_BOX_HTML = `<!-- Security Section -->
    <hbox id="identity-popup-security" class="identity-popup-section">
    <vbox class="identity-popup-security-content" flex="1">

        <vbox class="identity-popup-security-connection">
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

        <vbox id="identity-popup-security-description">
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

        <vbox id="identity-popup-security-httpsonlymode" when-httpsonlystatus="exception upgraded failed-top failed-sub">
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
            oncommand="gIdentityHandler.showSecuritySubView();"/>
    </hbox>`;

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
        }
    });
}