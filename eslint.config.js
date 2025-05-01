import js from "@eslint/js";
import globals from "globals";
import { fileURLToPath } from "url";
import { dirname } from "path";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import prettierPlugin from "eslint-plugin-prettier";

// Compute __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Prettier configuration
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

// Create React plugin configuration
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

// Configuration for JavaScript files
export default [
  js.configs.recommended,
  {
    // Base config for all files
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
      // Add JSX parsing capability
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
