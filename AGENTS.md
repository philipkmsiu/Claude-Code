# AGENTS.md

## Cursor Cloud specific instructions

- This repository currently contains no application code, dependency manifests, tests, or build tooling. The only tracked file is `README.md` (contents: `# Claude-Code`).
- Because there is nothing to install, there is no meaningful update/setup script yet. The configured update script is intentionally a no-op until a dependency manifest (e.g. `package.json`, `requirements.txt`, `pyproject.toml`, `go.mod`, `Cargo.toml`) is added.
- The VM already provides common runtimes: Node.js 22, npm 10, Python 3.12, Go 1.22, Cargo 1.83, and Java 21. Prefer these unless the project later pins specific versions.
- When real code is added, update this section with the actual lint/test/build/run commands (or point to `package.json` scripts / a `Makefile` / README), and replace the no-op update script with the appropriate dependency-install command.
