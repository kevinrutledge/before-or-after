import js from "@eslint/js";
import globals from "globals";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "packages/react-frontend/dist/**",
      "examples/**"
    ]
  },

  js.configs.recommended,

  {
    // Base rules for all JavaScript files
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        jsx: true
      }
    },
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "import", next: "*" },
        { blankLine: "any", prev: "import", next: "import" }
      ],
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
  },

  {
    // React-specific rules for frontend
    files: ["packages/react-frontend/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser
      },
      parserOptions: {
        jsx: true,
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      prettier: prettierPlugin
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
      "react/react-in-jsx-scope": "off",
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
  },

  {
    // Node-specific rules for backend
    files: ["packages/express-backend/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node
      }
    },
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
  },

  {
    // Jest environment for test files
    files: ["**/*.test.js", "**/tests/**/*.js", "**/tests/**/*.jsx"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.jest,
        ...globals.node
      }
    },
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn",
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
  }
];
