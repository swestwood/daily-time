// Copyright 2018 Quip

/**
 * @fileoverview unix-style formatter based on
 * https://github.com/eslint/eslint/blob/master/lib/formatters/unix.js
 *
 * Will out paths relative to our root directory, which will be friendly to
 * iterm and vscode's terminal integration
 */
"use strict";

//------------------------------------------------------------------------------
// Helper Functions
//------------------------------------------------------------------------------

/**
 * Returns a canonical error level string based upon the error message passed in.
 * @param {Object} message Individual error message provided by eslint
 * @return {string} Error level string
 */
function getMessageType(message) {
    if (message.fatal || message.severity === 2) {
        return "Error";
    }
    return "Warning";

}


//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

/**
 * @param  {Array} results
 * @return {string}
 */
module.exports = function(results) {
    let output = "";
    let total = 0;

    results.forEach(result => {

        const messages = result.messages;

        total += messages.length;

        messages.forEach(message => {

            output += `${result.filePath.replace(/^\/code\//, "")}:`;
            output += `${message.line || 0}:`;
            output += `${message.column || 0}:`;
            output += `  ${getMessageType(message).toLowerCase()}`;
            output += `  ${message.message} `;
            output += message.ruleId ? `[${message.ruleId}]` : "";
            output += "\n";

        });

    });

    if (total > 0) {
        output += `\n${total} problem${total !== 1 ? "s" : ""}`;
    }

    return output;
};
