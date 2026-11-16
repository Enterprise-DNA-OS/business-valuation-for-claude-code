# Move the valuation records from ValuSource

ValuSource's [quick-start guide](https://www.valusource.com/wp-content/uploads/2016/05/valusource_software_quickstart.pdf) describes opening the valuation workbook in standalone Excel. Its [M&A Comps help](https://support.valusource.com/support-article/6973/) separately documents exporting comparison data to Excel. Checked 16 November 2026. Neither establishes a universal CSV layout or permission to redistribute purchased datasets.

1. Retain the original valuation workbook, reports and licence terms. Work on a copy in Excel. The vendor [licence FAQ](https://www.valusource.com/licfaq/) restricts reuse of its workbooks and data after subscription expiry. Bring customer-owned financial inputs from their original accounts, not vendor formulas or licensed comparison outputs. Keep any required data licences.
2. Prepare one annual-financial row per engagement and financial period. Copy the selected values, not formulas, to a worksheet with the headings in examples/financials.csv, then save that sheet as UTF-8 CSV. Do not include unrelated personal information. This is a prepared interchange file, not an untouched native export.
3. Create the matching engagements with add-engagement. Match codes, period dates, currency, units and sign conventions. Figures are whole currency units, not thousands. Rates are separate scenario records.
4. Review examples/financials-mapping.json against the saved headings. Every mapping is explicit; the sample is not a claim about your workbook's columns.
5. Run the one import command first as a dry run, then without the dry-run option.

```bash
npm run valuation -- import valusource examples/financials.csv --mapping=examples/financials-mapping.json --actor="Your name" --dry-run
npm run valuation -- import valusource examples/financials.csv --mapping=examples/financials-mapping.json --actor="Your name"
```

The importer validates all rows before commit and rolls back the whole batch on failure. It rejects missing fields, duplicate periods within a batch, ambiguous engagements, invalid dates and non-decimal amounts. It updates financials by engagement and period and retains original bytes plus the mapping in a private import record. An identical file and mapping is recognised as already imported. A changed file creates a new batch and audit history; financial changes invalidate review.

Compare each financial total and period with the source workbook before relying on the new system. Bring forecasts, adjustments, evidence references and scenario assumptions through their named add commands. Proprietary formulas, report layouts, licensed databases, historical conclusion signatures and document attachments are not migrated by this financial importer. We have not tested a real customer workbook. Mapping and reconciliation come before a switch-in-a-day commitment; Enterprise DNA does that work as part of the custom version.

Export writes all eleven record collections plus a count manifest to a new private directory. It is a portable archive, not a restore command. Back up the underlying database and test a restore separately. Keep your original ValuSource files until reconciliation and practitioner review are complete.
