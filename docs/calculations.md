# Calculation contract

All financial amounts are in the engagement currency. There is no foreign-exchange conversion or cross-currency total. Decimal values are stored in numeric columns; method results round to cents. Data entry accepts plain decimals, not currency symbols or grouping commas.

The latest annual financial period on or before the valuation date is selected. Enter annual amounts consistently; no automatic annualisation takes place. Normalised EBITDA is reported EBITDA plus accepted adjustments for that exact period. Positive adjustments add back costs; negative adjustments reduce earnings. Unaccepted adjustments stay visible but do not affect results.

Enterprise value under the earnings method is normalised EBITDA times the explicitly entered multiple. Equity value adds recorded cash and subtracts recorded debt. There is no automatic control premium, marketability discount, excess asset adjustment or ownership percentage. Record these in a separately reviewed extension before using them.

DCF uses explicitly entered end-of-year free cash flows to the firm, discounted by the scenario rate. For years 1 through N, present value is the sum of cashflow[t] / (1 + rate)^t. Terminal value is cashflow[N] * (1 + growth) / (rate - growth), discounted by (1 + rate)^N. Equity adds cash and subtracts debt. Rate must exceed terminal growth and be positive; forecasts must start at year 1 without gaps. Incomplete inputs produce unknown, never a fabricated zero. Rates are decimal fractions: 0.15 means 15 percent. Sensitivity changes only the discount rate by minus one, zero and plus one percentage point; invalid combinations are omitted.

Book net assets means entered assets minus entered liabilities. It is not an asset appraisal. Comparable multiples are enterprise value divided by positive EBITDA, with currency and date flags. They never select a scenario multiple automatically. The two-year comparable flag is a local review policy, not a legal limit.

All calculations are draft analytical work. Reviewers decide the method, assumptions, adjustments and final professional conclusion. The software never issues a valuation certificate or investment recommendation.
