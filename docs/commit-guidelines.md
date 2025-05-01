# Git Commits & Pull Requests

When contributing to this repo, follow these lightweight Conventional Commit and PR guidelines to keep history clear and maintainable.

---

## Commit Messages

Use the format:

```
<type>[optional scope]: <short description>

[optional body]

[optional footer(s)]
```

- **Types**:

  - `feat` – a new feature
  - `fix` – a bug fix
  - `chore` – housekeeping (e.g., updating deps)
  - `refactor` – code change without feature or fix
  - `docs` – documentation only
  - `style` – formatting, whitespace, etc.
  - `test` – adding or correcting tests
  - `perf` – performance improvements
  - `ci` – CI config changes
  - `build` – build system or external dependencies
  - `revert` – revert a previous commit

- **Description**:
  - Lowercase, no more than 50 characters.
  - Body (if needed) no more than 72 characters per line.

### Examples

```bash
git commit -m "fix(ui): correct button alignment"

git commit -m "feat: add CSV import for bulk cards"

# with body
git commit -m "perf(api): optimize query speed" -m "Use indexed fields for faster lookups"
```

---

## Pull Requests

When collaborating with teammates, you’ll work in **branches** — isolated copies of the main codebase — so you can build features or fix bugs without impacting others’ work.

Once your changes are ready, open a **pull request (PR)** to merge your branch into `main`. GitHub will surface the PR template; be sure to fill out every section (summary, list of modifications, testing notes, and the checklist). PRs missing required details may be held up in review or blocked from merging.
