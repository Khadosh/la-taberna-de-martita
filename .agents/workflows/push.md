---
name: push
description: Performs a git pull to stay up to date, checks status (relevamiento), updates documentation files (agents.md, roadmap.md, proposals), stages files, commits with Conventional Commits, and pushes.
disable-model-invocation: false
---

# Push Skill

This skill is triggered when the user executes `/push` or asks the agent to perform a status check, document, commit, and push.

## Guidelines

1. **Pull and Sync First (CRITICAL)**:
   - Run `git pull` to ensure the local repository is completely up to date with `origin/main` before doing any work or staging.
   - If there are conflicts or divergent branches, stop and notify the user to reconcile them.

2. **Status Check (Relevamiento)**:
   - Run `git status` to inspect modified, deleted, or untracked files.

3. **Update Documentation**:
   - Keep `agents.md` and `roadmap.md` up to date with the latest changes in the repository.
   - Mark completed tasks with `✅` in the roadmap.
   - If a new feature or design proposal is added, save it under `docs/`.

4. **Stage Changes**:
   - Run `git add .` to stage all modifications.

5. **Conventional Commit**:
   - Formulate a Conventional Commit message in lowercase without a trailing period:
     - `docs: update agents, roadmap and proposals` if only docs were modified.
     - `feat: <description>` for new features.
     - `fix: <description>` for bug fixes.
     - `refactor: <description>` for refactoring.
     - `chore: <description>` for configuration, scripts, or dependency updates.
   - Execute `git commit -m "<message>"`.

6. **Push**:
   - Execute `git push` to upload the changes.

7. **Report**:
   - Give the user a concise report of the files committed and the commit message used.
