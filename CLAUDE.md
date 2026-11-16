# Business Valuation for Claude Code: operating instructions

This is a trusted-operator valuation desk. Read README.md, docs/calculations.md and docs/compliance.md before interpreting results. Demo records are fictional. The business name and colours live in brand.json.

## Rules

- Use the CLI for records. Never invent financials, comparables, sources, prices or command output.
- Keep currencies separate. Amounts are whole currency units; rates are decimal fractions. Missing results are unknown.
- Read the engagement and evidence before changing assumptions. Mutations require the operator's --actor label. A name is not authentication.
- Independent reviews are tied to revisions and become stale after input changes. They do not issue a professional conclusion or certify compliance.
- Never send, publish, disclose private records or delete business history. Drafts stay in drafts/ for a person to review.
- Import only a reviewed prepared worksheet with explicit mapping. Run dry-run, then compare the imported financials with the original workbook.
- Put schema changes in a new migration and test on a temporary store first. Never commit private records, exports, generated documents or credentials.
- Run npm test after changes. Stay on main. Every authored commit ends with Agent: omni-rebuild-strategist.

## Routing

| Request | Command recipe |
|---|---|
| scope review | /scope-review |
| earnings review | /earnings-review |
| scenario review | /scenario-review |
| evidence follow up | /evidence-follow-up |
| weekly review | /weekly-review |
| draft request | /draft-request |
| import | /import |
| export | /export |
| customise | /customise |
| new view | /new-view |

Every CLI command has a matching recipe under .claude/commands/. For individual reads or edits, open the recipe with that name and docs/cli.md. Run npm run valuation -- help to list commands. Never answer from remembered demo output.

## Storage

DATABASE_URL selects PostgreSQL. Otherwise PGlite lives under .data/db or DATA_DIR. Only trusted operators have direct access. Configure authentication, roles and tested backups before shared use. Documents and views are read-only HTML, branded through brand.json. No front end or live market-data service is included.

Built and run for you through Omni by Enterprise DNA: https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=valusource
