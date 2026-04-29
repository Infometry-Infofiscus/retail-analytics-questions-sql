# 🤝 Contributing to the Retail Analytics Text-to-SQL Dataset

Thank you for contributing! This guide walks you through everything you need to submit a high-quality use case.

---

## 🧭 Before You Begin

- Read [DATA_SPEC.md](./DATA_SPEC.md) to understand required fields, validation rules, and allowed dropdown values
- Browse the [examples/](./examples/) folder to see what good contributions look like
- Make sure your use case is based on a real or realistic business scenario

---

## 🪜 Step-by-Step Contribution Guide

### Option A — UI Form *(Recommended)*

The fastest way to contribute — no JSON editing required.

1. Open the **[Query Entry Form](https://infometry-infofiscus.github.io/text2sql_data_collection_platform/)** in your browser
2. Fill in all required fields — the **Live JSON panel** on the right updates in real time
3. Copy the generated JSON from the Live JSON panel
4. Save it as a `.json` file following the [naming convention](#4-file-naming-convention) below
5. Place in `submissions/pending/` and open a Pull Request

---

### Option B — Manual JSON or Markdown

#### 1. Fork the Repository

Click **Fork** at the top of this GitHub page, then clone locally:

```bash
git clone https://github.com/Infometry-Infofiscus/retail-analytics-questions-sql.git
cd retail-analytics-questions-sql
```

---

#### 2. Choose Your Template

| Template | Best For |
|---|---|
| `templates/submission_template.json` | Developers comfortable with JSON |
| `templates/submission_template.md` | Anyone preferring plain text first |

Copy to `submissions/pending/`:

```bash
cp templates/submission_template.json submissions/pending/<domain>_<topic>_<short_description>.json
```

---

#### 3. Fill In Your Use Case

Complete all required fields. Refer to [DATA_SPEC.md](./DATA_SPEC.md) for detailed guidance.

| Field | What to Write |
|---|---|
| `domain` | Pick from: Retail, Healthcare, HighTech (SaaS), Finance, Manufacturing, Supply Chain, Other |
| `difficulty` | Pick from: Easy, Medium, Hard, Expert |
| `db_type` | Pick from: BigQuery, Snowflake, Redshift, PostgreSQL, MySQL, Oracle, Azure Synapse, Other |
| `instruction` | The business question as a real user would ask it |
| `context` | Who is asking, what decision the answer will inform |
| `required_metrics_kpis` | List of KPI names the query must produce |
| `aggregation_logic` | Each KPI name mapped to its aggregation formula in plain language |
| `chain_of_thought` | *(Optional)* Step-by-step reasoning — how you'd explain the query logic |
| `data_model.facts` | Comma-separated fact table names (e.g. `fact_sales`) |
| `data_model.dims` | Comma-separated dimension table names (e.g. `dim_product, dim_date`) |
| `data_model.hierarchies` | e.g. `Date > Month > Year, Product > Category` |
| `data_model.aggrs` | Named aggregation layer (e.g. `agg_quarterly_revenue`) |
| `data_model.snapshots` | Snapshot table if applicable (e.g. `snap_inventory_daily`) |
| `sql` | *(Optional)* SQL query answering the question |

---

#### 4. File Naming Convention

```
<domain>_<topic>_<short_description>.json
```

**Examples:**
- `retail_revenue_category_quarterly_decline.json`
- `retail_inventory_slow_moving_products.json`
- `retail_customers_high_value_segmentation.json`
- `finance_mrr_subscription_status.json`
- `supply_chain_supplier_lead_time_variance.json`

**Rules:**
- Lowercase only
- Words separated by underscores
- Start with domain prefix (e.g. `retail_`, `finance_`, `healthcare_`)
- Keep under 60 characters total
- Descriptive but concise

---

#### 5. Place Your File

Save your completed file to:

```
submissions/pending/
```

Do **not** place files in `submissions/reviewed/` or `submissions/rejected/` — those are managed by maintainers.

---

#### 6. Open a Pull Request

```bash
git add submissions/pending/your_filename.json
git commit -m "Add: retail category revenue quarterly decline example"
git push origin main
```

Open a **Pull Request** against the `main` branch. In your PR description briefly include:
- Domain and topic your example covers
- Whether SQL is included
- Any schema assumptions or variations made

---

## 📋 Contribution Guidelines

### ✅ Do

- Use **real-world or realistic** business scenarios
- Write `instruction` as a business user would naturally ask it
- Write `aggregation_logic` in plain language — avoid SQL jargon
- Use table and column names from the [standard schema](./DATA_SPEC.md)
- Validate your JSON before submitting — try [jsonlint.com](https://jsonlint.com)
- Include SQL if you can — it significantly improves dataset quality
- Make sure `required_metrics_kpis` list matches keys in `aggregation_logic`

### ❌ Don't

- Include **sensitive data** — no real customer names, emails, or PII
- Reference **internal systems** or proprietary company names
- Use **non-standard table names** without noting the variation
- Submit **incomplete entries** with empty required fields
- Submit **duplicates** already covered in the examples folder

---

## 🔄 Review Process

1. You submit a PR with your file in `submissions/pending/`
2. A maintainer reviews for quality, correctness, and completeness
3. If approved → moved to `submissions/reviewed/` and merged
4. If changes needed → feedback left on the PR
5. If not suitable → moved to `submissions/rejected/` with a reason

We aim to review all PRs within **7 days**.

---

## 💬 Questions?

Open a [GitHub Issue](../../issues) or start a [Discussion](../../discussions) if you have questions about the schema, submission process, or how to frame your use case.

---

*Every contribution — big or small — makes this dataset better. Thank you!* 🙏
