## Introduction

This document guides new contributors through setting up issue management and
project workflows. Follow each section to configure templates, boards, and
labels. Use this guide when filing issues or updating the board.

## How to Write Issues and Tasks

Be clear and use full paths for file references. For front-end pages, place
your components under `packages/react-frontend/src/pages/`. For back-end code,
use `packages/express-backend/controllers` or `models` as needed. When drafting
an issue:

- Reference exact file or directory paths in the Steps section.
- Quote code snippets or commands using fenced blocks.
- Always include Milestone, Labels, and Assignees in metadata.

## Issue Templates

Issue templates ensure consistent reports and prompt for all necessary details.

### Location

Place templates in the `.github/ISSUE_TEMPLATE/` folder:

- `bug.md` for bug reports
- `feature-request.md` for enhancements

### Structure

1. **Title prefix**: start with `[BUG]` or `[FEATURE]`
2. **Description**: summarize the problem or solution
3. **Steps**: list reproduction steps or usage flow
4. **Outcome**: describe expected and actual behavior
5. **Context**: include environment details such as OS, Node version, and
   browser

> TIP: Provide screenshots or logs under a **Screenshots** section when
> applicable.

### Example

```markdown
---
name: Bug report
title: "[BUG] Application crashes on login"
labels: bug
---

## Describe the bug

App crashes when submitting the login form.

## To Reproduce

1. Go to `/login`
2. Enter valid credentials
3. Click **Submit**

## Expected behavior

Login succeeds and lands on the dashboard.

## Environment

- OS: macOS 12.3
- Browser: Chrome 100
```

## Issue Writing Guidelines

Provide clear direction for drafting and triaging issues:

- **Full template stubs**: Paste the complete contents of `bug.md` and
  `feature-request.md` here for reference.
- **Field guidance**:

  - **Description**: state what failed or is desired and why.
  - **Steps**: enumerate exact user actions or API calls.
  - **Outcome**: contrast expected vs. actual results.
  - **Context**: include environment, version, or relevant data.

- **Title conventions**:

  - _Bad:_ “Something broke”
  - _Good:_ “\[BUG] Crash on login when password contains #”

- **Labels mapping**:

  | Template        | Default Label | Priority Reminder          |
  | --------------- | ------------- | -------------------------- |
  | Bug report      | `bug`         | add `priority: high`       |
  | Feature request | `feature`     | add appropriate `priority` |

- **Milestone rules**: Assign to `Sprint X` based on feature scope and due date.
- **Definition of Done**: Each issue should include:

  1. Clear reproduction or goal statement
  2. Relevant context or data
  3. Acceptance criteria or expected outcome

- **Do/Don’t examples**: Show a filled bug and feature issue for pattern
  matching.

## Pull Request Template

Standardize code reviews and ensure quality.

### Location

Place the template in `.github/PULL_REQUEST_TEMPLATE.md`

### Structure

- **Summary**: explain the purpose of this change
- **Modifications**: list altered or created files
- **Testing**: outline tested scenarios
- **Checklist**: verify code quality and standards
- **Media**: attach screenshots or screencasts

> NOTE: Link to our **commit-message guidelines** in the Checklist section to
> enforce consistency.

## Project Board Workflow

Organize work with five columns. Move cards as you progress.

1. **Backlog**: new issues and pull requests awaiting triage
2. **Todo**: ready for development
3. **In Progress**: work actively underway
4. **Review**: awaiting code review or QA
5. **Done**: completed and merged or closed

> TIP: Label an issue **in progress** and move it to **In Progress** when you
> begin work.

## Labels Guide

Use labels to categorize work by type and urgency.

- **Type**: `backend`, `frontend`, `bug`, `chore`, `documentation`, `feature`
- **Priority**: `priority: high`, `priority: medium`, `priority: low`

Apply a type label when creating an issue. Update priority to reflect impact and
urgency.

## Milestones

- **Sprint length**: 1 week, each due Friday.
- **Sprint 1 (4 Days)**: clickable UI shell for Home, Game, and Loss.

  - _Tech Lead support_: deliver starter code and pair on setup.

- **Sprint 2 (Week 2)**: login and signup pages; initial Admin Dashboard stub
  (Kevin).
- **Sprint 3 (Week 3)**: finish Admin Dashboard; enhance Home, Game, Loss,
  Login, and Signup.

  - _Tech Lead support_: guide juniors on admin completion and public
    enhancements.

- **Sprint 4 (Week 4)**: polish, tests, CI/CD, and deploy by week end.

## Project Board Automations

Enable GitHub’s built-in workflows. No custom code is required.

1. **Item added** → set status to **Backlog**
2. **In Progress label** → set status to **In Progress**
3. **Review approved** → set status to **Review**
4. **Closed or merged** → set status to **Done**
5. **Auto-archive** → remove **Done** cards after the configured delay

To view archived cards, choose **•••** then **Show archived items**. Hover over
a card and click the unarchive icon to restore.

## Sprint Planning & Onboarding

Guide for sprint cadence and task assignments:

- **Sprint length**: 1 week, each due Friday.
- **Sprint 1 (4 Days)**: clickable UI shell for Home, Game, and Loss.

  - _Tech Lead support_: deliver starter code and pair on setup.

- **Sprint 2 (Week 2)**: login and signup pages; initial Admin Dashboard stub
  (Kevin).
- **Sprint 3 (Week 3)**: finish Admin Dashboard; enhance Home, Game, Loss,
  Login, and Signup.

  - _Tech Lead support_: guide juniors on admin completion and public
    enhancements.

- **Sprint 4 (Week 4)**: polish, tests, CI/CD, and deploy by week end.
- **Task sizing**: Small (\~1 h), Medium (\~2 h), Large (>4 h).
- **Definition of Done**: list acceptance criteria in each issue.
- **WIP limit**: max 2 tasks per person in **In Progress**.
- **Stand-ups**: daily 15 min check-ins.
- **Retros**: end-of-sprint record of wins and improvements.
