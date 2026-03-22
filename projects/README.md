# projects/

Each project must live under its own `project_slug` directory.

## Recommended layout

```text
projects/{project_slug}/
  docs/
    api/
    swagger/
    requirements/
    features/
    architecture/
    testing/
    usage/
  memory/
    MEMORY.md
    SESSION-STATE.md
    YYYY-MM-DD.md
  reports/
  automation/
```

## Rules

- One project, one `project_slug`
- Project docs, reports, automation, and memory stay inside that project directory
- Do not put project-specific facts into root `MEMORY.md`
- Root files are for workspace and human-level coordination only

## Minimum project files

- `projects/{project_slug}/memory/MEMORY.md`
- `projects/{project_slug}/memory/SESSION-STATE.md`
- `projects/{project_slug}/docs/requirements/`
- `projects/{project_slug}/docs/features/`
- `projects/{project_slug}/docs/architecture/`
