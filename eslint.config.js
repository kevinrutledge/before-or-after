import js from "@eslint/js";
import globals from "globals";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import prettierPlugin from "eslint-plugin-prettier";

// Prettier rules
const prettierConfig = {
  plugins: {
    prettier: prettierPlugin
  },
  rules: {
    "prettier/prettier": [
      "error",
      {
        trailingComma: "none",
        semi: true,
        singleQuote: false,
        bracketSameLine: true,
        htmlWhitespaceSensitivity: "ignore",
        proseWrap: "always",
        printWidth: 80
      }
    ]
  }
};

// React plugin rules
const reactConfig = {
  plugins: {
    react: reactPlugin,
    "react-hooks": reactHooksPlugin
  },
  settings: {
    react: {
      version: "detect"
    }
  },
  rules: {
    ...reactPlugin.configs.recommended.rules,
    ...reactHooksPlugin.configs.recommended.rules,
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off"
  }
};

// JavaScript rules
export default [
  js.configs.recommended,
  {
    // All file rules
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        jsx: true
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "import", next: "*" },
        { blankLine: "any", prev: "import", next: "import" }
      ]
    },
    ...prettierConfig
  },
  {
    // React-specific rules for frontend
    files: ["packages/react-frontend/**/*.{js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser
      },
      // Use the same parser options as the base config
      parserOptions: {
        jsx: true,
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    // Tell ESLint to ignore JSX parsing errors
    linterOptions: {
      reportUnusedDisableDirectives: false,
      noInlineConfig: false
    },
    ...reactConfig
  },
  {
    // Node-specific rules for backend
    files: ["packages/express-backend/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
];
