var through = require("through2");

const USERSCRIPT_PROLOGUE = "/* ==UserScript==";
const USERSCRIPT_FOOTER =  "// ==/UserScript==*/";

function insert(str, index, value)
{
    return str.substr(0, index) + value + str.substr(index);
}

module.exports = function(message)
{
    return through.obj(function(file, encoding, callback)
    {
        let fileContents = file.contents.toString();
        let messageIndex = 0;

        // We can't write above the userscript header, because that is required for
        // proper parsing of the userscript.
        if (fileContents.indexOf(USERSCRIPT_PROLOGUE) == 0)
        {
            messageIndex = fileContents.indexOf(USERSCRIPT_FOOTER) + USERSCRIPT_FOOTER.length;
        }

        // Hack to add a new line if a new line should probably be added.
        if (messageIndex > 0)
        {
            fileContents = insert(fileContents, messageIndex, "\n\n");
            // Message content needs to be added after the added line breaks, not before.
            messageIndex += 2;
        }

        fileContents = insert(fileContents, messageIndex, message);

        file.contents = Buffer.from(fileContents);

        // Send back the input
        this.push(file);
        callback();
    });
};