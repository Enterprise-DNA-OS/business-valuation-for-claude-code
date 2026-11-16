# Command reference

All commands accept --json. Mutations require --actor. File paths resolve from your working directory. Use exact engagement codes, names ignoring case, or UUID prefixes. Financial and forecast rows have no names: use their UUID prefixes from financial-history or forecasts. Ambiguity lists candidates and exits 1. Named actors do not authenticate a person.

Read commands return all engagements. Choose only the records relevant to an answer; do not claim a filter was applied when it was not. Draft and export paths never overwrite an existing file or directory. Output files use OUTPUT_DIR when provided.

- help: `npm run valuation -- help`
- engagements: `npm run valuation -- engagements`
- engagement-detail: `npm run valuation -- engagement-detail`
- financials: `npm run valuation -- financials`
- financial-history: `npm run valuation -- financial-history`
- adjustments: `npm run valuation -- adjustments`
- forecasts: `npm run valuation -- forecasts`
- scenarios: `npm run valuation -- scenarios`
- valuations: `npm run valuation -- valuations`
- calculation-detail: `npm run valuation -- calculation-detail`
- comparables: `npm run valuation -- comparables`
- evidence: `npm run valuation -- evidence`
- reviews: `npm run valuation -- reviews`
- actions: `npm run valuation -- actions`
- attention: `npm run valuation -- attention`
- compliance: `npm run valuation -- compliance`
- review-queue: `npm run valuation -- review-queue`
- source-gaps: `npm run valuation -- source-gaps`
- audit: `npm run valuation -- audit`
- imports: `npm run valuation -- imports`
- add-engagement: `npm run valuation -- add-engagement --data=<reviewed.json> --actor="<operator>"`
- edit-engagement: `npm run valuation -- edit-engagement <record> --data=<reviewed.json> --actor="<operator>"`
- add-financial: `npm run valuation -- add-financial <engagement> --data=<reviewed.json> --actor="<operator>"`
- edit-financial: `npm run valuation -- edit-financial <record> --data=<reviewed.json> --actor="<operator>"`
- add-adjustment: `npm run valuation -- add-adjustment <engagement> --data=<reviewed.json> --actor="<operator>"`
- edit-adjustment: `npm run valuation -- edit-adjustment <record> --data=<reviewed.json> --actor="<operator>"`
- add-forecast: `npm run valuation -- add-forecast <engagement> --data=<reviewed.json> --actor="<operator>"`
- edit-forecast: `npm run valuation -- edit-forecast <record> --data=<reviewed.json> --actor="<operator>"`
- add-scenario: `npm run valuation -- add-scenario <engagement> --data=<reviewed.json> --actor="<operator>"`
- edit-scenario: `npm run valuation -- edit-scenario <record> --data=<reviewed.json> --actor="<operator>"`
- add-comparable: `npm run valuation -- add-comparable <engagement> --data=<reviewed.json> --actor="<operator>"`
- edit-comparable: `npm run valuation -- edit-comparable <record> --data=<reviewed.json> --actor="<operator>"`
- add-evidence: `npm run valuation -- add-evidence <engagement> --data=<reviewed.json> --actor="<operator>"`
- edit-evidence: `npm run valuation -- edit-evidence <record> --data=<reviewed.json> --actor="<operator>"`
- add-action: `npm run valuation -- add-action <engagement> --data=<reviewed.json> --actor="<operator>"`
- edit-action: `npm run valuation -- edit-action <record> --data=<reviewed.json> --actor="<operator>"`
- review: `npm run valuation -- review <engagement> --revision=<reviewed revision> --decision=accepted --note="<evidence decision>" --actor="<reviewer>"`
- close-action: `npm run valuation -- close-action <action> --note="<closure evidence>" --actor="<operator>"`
- sensitivity: `npm run valuation -- sensitivity <engagement>`
- weekly-review: `npm run valuation -- weekly-review`
- draft-request: `npm run valuation -- draft-request <engagement>`
- import: `npm run valuation -- import valusource <prepared.csv> --mapping=<profile.json> --actor="<operator>" --dry-run`
- export: `npm run valuation -- export <new-private-directory>`

## Mutation fields

add creates a record; edit changes only supplied fields. Engagement and parent identifiers cannot be moved through an edit. Use actual JSON numbers and booleans. Rates are decimal fractions, dates YYYY-MM-DD, financial amounts whole currency units. Do not guess missing figures.

- engagement: code, name, currency, valuation_date, due_date, preparer, purpose, basis, premise, scope, intended_users, independence_note, retention_review, status
- financial: period_end, revenue, ebitda, cash, debt, assets, liabilities, source
- adjustment: period_end, name, amount, rationale, source, accepted
- forecast: year_no, cashflow, source
- scenario: name, discount_rate, terminal_growth, ebitda_multiple, rationale
- comparable: name, observed_on, currency, enterprise_value, ebitda, source, selection_note, included
- evidence: name, source, observed_on, review_due, owner
- action: name, owner, due_date, status, closure_note

The import mapping names engagement plus every financial field. The example headings are a prepared interchange format, not a native ValuSource export guarantee. See replace-valusource.md.

Reviews are append-only and tied to the current revision. Resolve input and evidence findings before accepting. The reviewer must differ from the recorded preparer. The same person can still type another name: real identity enforcement is deployment work. Revisions change on edits to source data. Review acceptance never sends or certifies a valuation.
