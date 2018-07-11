// Copyright 2018 Quip

// "off": Turn the rule off.
// "warn": Turn the rule on as a warning (doesn't affect exit code). Should
// be used while rules are phased in.
// "error": Turn the rule on as an error (exit code is 1 when triggered).
// Should be used for most enabled rules.
// http://eslint.org/docs/user-guide/configuring.html
// https://www.npmjs.com/package/eslint-plugin-react

module.exports = {
    "extends": [
        "./eslintrc-base.js",
        "eslint:recommended",
        "plugin:react/recommended",
    ],
    "plugins": ["react", "jsx-a11y"],
    "settings": {
        "react": {
            "pragma": "React",
            "version": "15.3.2",
            "createClass": "createClass",
        },
    },
    "rules": {
        "array-callback-return": "error",
        "arrow-body-style": ["error", "as-needed"],
        "no-console": "off",
        "no-constant-condition": "off",
        "no-empty": "off",
        "no-eval": "error",
        "no-fallthrough": "error",
        "no-new-wrappers": "error",
        "no-loop-func": "off",
        // It's convenient and harmless to redeclare for loop variables in the
        // same scope (to make code more self-contained), so no-redeclare has
        // too many false positives. We have a no-nested-for-variables custom
        // rule instead that tries to flag redeclarations that are more
        // obviously bugs.
        "no-redeclare": "off",
        "no-self-assign": "error",
        "no-sequences": "error",
        "no-shadow": "off",
        "no-useless-computed-key": "error",
        "no-useless-constructor": "error",
        "no-var": "error",
        "lines-between-class-members": "error",
        "dot-location": ["error", "property"],
        "curly": "error",
        "brace-style": [
            "error",
            "1tbs",
            {
                "allowSingleLine": true,
            },
        ],
        "camelcase": "error",
        "no-undef": "error",
        // Prefer object shorthand for methods since it makes React.createClass
        // parameters more ES6 class-like (and saves some characters and reduces
        // the likelihood of wrapping for methods with several parameters).
        "object-shorthand": [
            "error",
            "always",
            {
                "avoidQuotes": true,
            },
        ],
        // Require one variable declaration per `var` statement, to help with
        // scannability and clean diffs.
        "one-var": ["error", "never"],
        "linebreak-style": ["error", "unix"],
        "prefer-arrow-callback": "error",
        "prefer-const": [
            "error",
            {
                "destructuring": "all",
            },
        ],
        // Prefer Prettier for formatting rules
        "array-bracket-spacing": "off",
        "arrow-parens": "off",
        "arrow-spacing": "off",
        "block-spacing": "off",
        "comma-dangle": "off",
        "comma-spacing": "off",
        "jsx-quotes": "off",
        "key-spacing": "off",
        "keyword-spacing": "off",
        "max-len": "off",
        "no-multi-spaces": "off",
        "no-trailing-spaces": "off",
        "no-whitespace-before-property": "off",
        "operator-linebreak": "off",
        "quotes": "off",
        "react/jsx-indent": "off",
        "react/jsx-tag-spacing": "off",
        "semi": "off",
        "semi-spacing": "off",
        "space-before-blocks": "off",
        "space-before-function-paren": "off",
        "space-in-parens": "off",
        "space-infix-ops": "off",
        "space-unary-ops": "off",
        "spaced-comment": "off",
        "template-curly-spacing": "off",

        // React plugin
        "react/default-props-match-prop-types": [
            "error",
            {
                "allowRequiredDefaults": true,
            },
        ],
        "react/no-did-update-set-state": "error",
        "react/no-did-mount-set-state": "error",
        "react/no-direct-mutation-state": "error",
        // TODO: enable eventually when we remove all the findDOMNode calls
        "react/no-find-dom-node": "off",
        "react/no-unknown-property": "error",
        "react/self-closing-comp": [
            "error",
            {
                "component": true,
                "html": true,
            },
        ],
        // Disable a few "recommended" rules:
        // The JSX transformer will generate a displayName for us.
        "react/display-name": "off",
        // We use a global namespace and don't import classes for use as JSX
        // tags.
        "react/jsx-no-undef": "off",
        // TODO: reenable this once we fit all the vialotainos
        "react/jsx-key": "off",
        // We have a commit hook that flags changes that use
        // dangerouslySetInnerHTML
        // for extra review.
        "react/no-danger": "off",
        // isMounted is not actually deprecated yet.
        "react/no-is-mounted": "off",
        // The return value from ReactDOM.render is not actually deprecated yet.
        "react/no-render-return-value": "off",
        "react/no-string-refs": "off",

        // Ensure that there are no unused local variables. We don't check for
        // unused global variables since we use them to export namespaces for
        // other files to use. We allow unused arguments since we may have cases
        // where interfaces are implemented or methods overridden where we wish
        // to preserve the original signature.
        "no-unused-vars": "off",
    },
};
