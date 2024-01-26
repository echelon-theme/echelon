var readEchelonJson = await checkVersion();

async function checkVersion(string, isLocal) {
    let response = await fetch('https://raw.githubusercontent.com/apathum/echelon-test/main/version.json');
    if (isLocal = true) {
        response = await fetch('chrome://userchrome/content/echelon.json');
    }
    const data = await response.json();

    return data;
}

readEchelonJson.version;