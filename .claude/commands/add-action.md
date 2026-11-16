---
description: "add action for the business valuation desk"
---

# add-action

Read CLAUDE.md. Read the relevant engagement and history before changing anything. Resolve names through the CLI; if ambiguous, show the choices and ask the operator.

```bash
npm run valuation -- add-action <engagement> --data=<reviewed.json> --actor="<operator>"
```

Read docs/cli.md for allowed fields. Write the operator-provided values to a private JSON input, show material assumption changes before applying, then reread the result. Never invent amounts, evidence or actors.

Keep drafts in drafts/. Never send, publish or delete records. Describe calculation limitations from docs/calculations.md when relevant.
