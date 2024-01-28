// ==UserScript==
// @name			Echelon :: Identity Box
// @description 	Changes identity box text to match appropriate brand name.
// @author			aubymori
// @include			main
// ==/UserScript==

const brand = getShortProductName();

function identityLabelMutation(list, observer)
{
    for (const mut of list)
    {
        if (brand != Services.appinfo.name && mut.type == "attributes" && mut.attributeName == "value")
        {
            if (mut.target.value == Services.appinfo.name)
            {
                mut.target.value = brand;
            }
        }
    }
}

function observeIdentityLabel()
{
    let identity = document.getElementById("identity-icon-label");
    if (identity)
    {
        let observer = new MutationObserver(identityLabelMutation);
        observer.observe(identity, { attributes: true });
    }
}