---
description: "import for the business valuation desk"
---

# import

Read CLAUDE.md. Read the relevant engagement and history before changing anything. Resolve names through the CLI; if ambiguous, show the choices and ask the operator.

```bash
npm run valuation -- import valusource <prepared.csv> --mapping=<profile.json> --actor="<operator>" --dry-run
```

Read docs/replace-valusource.md. Inspect the workbook and mapping, compare units and dates, run the dry run, then apply the same reviewed input. Report row counts and reconciliation. Never promise arbitrary native workbook compatibility.

Keep drafts in drafts/. Never send, publish or delete records. Describe calculation limitations from docs/calculations.md when relevant.
