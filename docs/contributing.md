# Contributing

Here are all of the steps you should follow whenever contributing to this repo!

## Code Formatting and Linting

### Prettier

We use Prettier for automatic code formatting. Our configuration is in the `.prettierrc` file at the root:

```yaml
{
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 120
}
```

To manually format all files, run:

```bash
npm run format
```

### ESLint

We use ESLint to enforce coding best practices:

- **Backend** (`packages/express-backend`): Node.js ESLint rules
- **Frontend** (`packages/react-frontend`): React + Hooks ESLint rules

Run linting checks with:

```bash
npm run lint
```

Fix auto-fixable linting issues with:

```bash
npm run lint:fix
```

### Editor Integration

Each team member should set up their editor to work with our code style tools:

### VS Code

1. Install the Prettier extension
2. Install the ESLint extension
3. Enable "Format On Save" in settings

### Other Editors

- Prettier integration: https://prettier.io/docs/en/editors.html
- ESLint integration: https://eslint.org/docs/latest/use/integrations

## Making Changes

1. Before you start making changes, always make sure you're on the main branch, then `git pull` and `npm i` to make sure your code is up to date
2. Create a branch `git checkout -b <name-of-branch>`
3. Make changes to the code
4. `npm run lint` to ensure code standards. (running `npm run lint:fix` will fix most of the styling errors)
5. Run `npm run format` to apply code styling

## Committing Changes

When interacting with Git/GitHub, feel free to use the command line, VSCode extension, or Github desktop. These steps assume you have already made a branch using `git checkout -b <branch-name>` and you have made all neccessary code changes for the provided task.

1. View diffs of each file you changed using the VSCode Github extension (3rd icon on far left bar of VSCode) or GitHub Desktop
2. `git add .` (to stage all files) or `git add <file-name>` (to stage specific file)
3. `git commit -m "<type>[optional scope]: <description>"` or
   `git commit -m "<type>[optional scope]: <description>" -m "[optional body]"` or
   `git commit` to get a message prompt
4. `git push -u origin <name-of-branch>`

## Making Pull Requests

1. Go to the Pull Requests tab on [github.com](https://github.com/)
2. Find your PR, fill out the PR template
3. (If applicable, provide a screenshot of your work in the comment area)
4. Link your PR to the corresponding **Issue**
5. Request a reviewer to check your code
6. Once approved, your code is ready to be merged in 🎉
