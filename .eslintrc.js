module.exports = {
    extends: [
        'next/core-web-vitals',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'react', 'react-hooks'],
    rules: {
        // Disable warnings for unused variables
        "@typescript-eslint/no-unused-vars": "off",
        "no-unused-vars": "off",

        // Other common rules you might want
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn"
    },
}; 