# Retail Analytics Use Case Submission
Use this template to describe your retail analytics use case. Fill in each section below, then convert to JSON using `templates/submission_template.json` before placing in `submissions/pending/`.

---

## Difficulty
*Select one: Easy / Medium / Hard / Very Hard*

> Example: "Medium"

---

## DB Type
*Select one: Relational (SQL) / NoSQL / Graph / Time-Series*

> Example: "Relational (SQL)"

---

## Domain
*Select one: Retail / HighTech (SaaS) / Finance / Healthcare / Supply Chain / ...*

> Example: "Retail"

---

## Business Question (Instruction)
*Write the business question here as a real user would ask it.*

> Example: "Which stores had the highest return rate last quarter?"

---

## Business Context
*Who is asking? What decision will the answer inform?*

> Example: "The regional operations team is conducting a quarterly performance review and wants to identify stores with abnormal return rates before meeting with store managers."

---

## Metrics & Aggregation
*List each KPI and its aggregation formula. Add as many rows as needed.*

| KPI / Metric Name | Aggregation Formula |
|---|---|
| e.g. Store Return Rate (%) | e.g. COUNT(is_return=TRUE) / COUNT(*) grouped by store_id |
| | |

---

## Chain of Thought
*Walk through your reasoning step by step. All 7 steps recommended.*

1. **Step 1:** Explain the goal of the analysis and what you are trying to understand.
2. **Step 2:** Describe the type of data needed (e.g. sales, customers, inventory).
3. **Step 3:** Mention any conditions or filters applied (e.g. time period, exclusions).
4. **Step 4:** Explain how key metrics are calculated (e.g. totals, averages, growth).
5. **Step 5:** Describe how the final results are organized (e.g. grouped, sorted, ranked).
6. **Step 6:** Mention any edge cases or alternative approaches.
7. **Step 7:** Additional reasoning or assumptions.

---

## Schema Tables

### Fact Tables
*Check all that apply.*
- [ ] fact_sales
- [ ] fact_inventory
- [ ] fact_returns

### Dimension Tables
*Check all that apply.*
- [ ] dim_product
- [ ] dim_store
- [ ] dim_date
- [ ] dim_customer

---

## Data Model Layers

**Hierarchies:**
> Example: "Date > Month > Year, Product > Category"

**Aggregations:**
> Example: "agg_store_return_rate_quarterly"

**Snapshots:**
> Example: "snap_inventory_daily"

---

## SQL Answer *(Optional)*
*Paste your SQL query here.*

```sql
-- Your SQL here
```

---

*When ready, convert to JSON and save as:*
`submissions/pending/retail_<topic>_<short_description>.json`