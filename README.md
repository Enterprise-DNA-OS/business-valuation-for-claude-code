# Business Valuation for Claude Code

Your valuation engagements, financials, adjustments, scenarios and evidence in a database you own. Works with Claude Code, Codex, OpenCode or Cursor. MIT-licensed software from Enterprise DNA.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free source code. Install the demo, map your financial worksheet and run the desk. | Your fields, review rules, reports and ValuSource history mapped across. [Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=valusource). | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=valusource). |

## What this replaces

The record work behind a business valuation practice: scope review, financial normalisation, explicit scenario calculations, comparable evidence, review follow-up and draft workpapers. The base works from your entered data. It does not reproduce ValuSource's licensed datasets, all its methods or proprietary workbook formulas. A practitioner chooses the assumptions and issues the professional conclusion. Independent software, not affiliated with ValuSource.

ValuSource's [pricing page](https://www.valusource.com/pricing/), checked 16 November 2026, lists an annual multi-user software base of US$1,465 plus US$1,025 per charged user. Local customer invoices were not verified. See the landing page for the comparison; no savings or replacement of purchased data rights is promised.

## Quick start

Node 22.13 or later. No database account is needed for the embedded demo.

```bash
git clone https://github.com/Enterprise-DNA-OS/business-valuation-for-claude-code.git
cd business-valuation-for-claude-code
npm install
npm test
npm run demo
npm run valuation -- attention
npm run valuation -- valuations
npm run valuation -- compliance
npm run view
npm run docs
```

Demo records are fictional. They include an overdue engagement, a missing forecast year, expired evidence and an unaccepted adjustment. Seed is idempotent and leaves a nonempty engagement store alone. Never seed a working database. Shared seed requires an explicit --demo-database flag.

Without DATABASE_URL, PGlite stores records in .data/db or DATA_DIR. With DATABASE_URL, the same migrations use PostgreSQL. The base is for trusted operators: row security and public-role revocations do not provide individual user authentication. Configure roles, private storage and tested backups before shared use. Actor names are audit labels, not authenticated identities.

## Five weekly rituals

- /scope-review finds missing terms, independence notes and evidence.
- /earnings-review compares reported earnings with accepted adjustments.
- /scenario-review compares draft methods and rate sensitivity.
- /evidence-follow-up lists overdue source reviews and assigned actions.
- /weekly-review writes the Monday pack from engagements, attention and compliance.

The CLI has 43 commands, human output by default and --json for machines. Read [the command reference](docs/cli.md). Exact codes, case-insensitive names and UUID prefixes work. Ambiguous names list candidates and exit 1. Mutations require --actor. No command sends, publishes or deletes business records.

## Ten questions to ask

These cross-record questions work today. They are not a claim that ValuSource cannot produce similar analysis.

1. Which engagements are overdue and still have open evidence actions? `attention`
2. Which financial year feeds each valuation, and what adjustments were accepted? `financials`
3. Which forecast has a missing year that prevents a DCF calculation? `valuations`
4. How do the entered earnings and cash-flow methods differ by scenario? `valuations`
5. Which source records are overdue for review? `source-gaps`
6. Which comparable observations differ in currency or age? `comparables`
7. Which reviews became stale after the underlying numbers changed? `reviews`
8. How does a one-percentage-point rate change affect the draft equity value? `sensitivity DEMO-001`
9. Which engagements have missing independence or retention notes? `compliance`
10. Who changed the assumptions and what were the previous values? `audit`

## Calculation and review contract

Read [the methods](docs/calculations.md). DCF uses explicit annual free cash flows to the firm, an entered discount rate and terminal growth. The earnings method uses accepted adjustments and an entered multiple. Book net assets remain labelled as book amounts. Currencies never combine automatically. Missing inputs remain unknown. No automatic method weighting, marketability discount, control premium or final valuation conclusion is supplied.

Read [the compliance scope](docs/compliance.md). The office checks selected APES 225 record fields and operator-set retention dates. It does not certify compliance. Changing the inputs invalidates the recorded review; accepted reviews do not issue a report. Evidence and import history remain auditable.

## Your first hour: ten things to ask for

1. Change the business name and colours on every document.
2. Show this week's overdue engagements.
3. Explain the missing forecast in the demo.
4. Compare accepted and pending earnings adjustments.
5. Draft a request for the missing evidence.
6. Add a downside scenario with assumptions I provide.
7. Show the effect of a discount-rate change.
8. Map my prepared financial worksheet and run a dry run.
9. Add a purpose field or review policy through /customise.
10. Add a read-only partner dashboard through /new-view.

## Bring your history

[The ValuSource switching guide](docs/replace-valusource.md) distinguishes the original workbook from the prepared CSV used here. The importer handles annual financials with an explicit mapping, one atomic transaction, repeat detection, original bytes and an audit trail. A real customer workbook has not been tested. Forecasts, assumptions and evidence are separate entry steps. Mapping and reconciliation come before any switch-in-a-day commitment.

Exports contain all eleven collections and a count manifest. They are archives, not a restoration command. Test database backups separately. Keep exports, generated documents, workbooks and private records out of Git.

## Validation

npm test creates a temporary store, migrates twice, seeds twice and exercises all 43 commands. It checks a separately calculated DCF result, incomplete forecasts, independent review, revision invalidation, invalid amounts and dates, atomic import rollback, dry-run behaviour, original bytes, duplicate batches, HTML escaping, export counts and ambiguous-name exits. A manually dispatched workflow covers Windows and Linux with Node 22 and 24, plus PostgreSQL 17. Local test success does not imply those remote jobs have run.

## Installed for you

Enterprise DNA maps the records, adapts the methods and review rules, and operates your desk through Omni by Enterprise DNA. One setup fee, then a retainer. [Book Sam's 30-minute call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=valusource).
