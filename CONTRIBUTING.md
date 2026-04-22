# 🤝 Contributing to the Retail Analytics Text-to-SQL Dataset

Thank you for contributing! This guide walks you through everything you need to submit a high-quality use case.

---

## 🧭 Before You Begin

- Read [DATA_SPEC.md](./DATA_SPEC.md) to understand the required fields and schema
- Browse the [examples/](./examples/) folder to see what good contributions look like
- Make sure your use case is based on a real or realistic retail scenario

---

## 🪜 Step-by-Step Contribution Guide

### 1. Fork the Repository

Click the **Fork** button at the top of this GitHub page to create your own copy of the repository.

Then clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/retail-text-to-sql-dataset.git
cd retail-text-to-sql-dataset
```

---

### 2. Choose Your Template

Pick the format that works best for you:

| Template | Best For |
|---|---|
| `templates/submission_template.json` | Developers comfortable with JSON |
| `templates/submission_template.md` | Non-technical contributors preferring plain text |

Copy your chosen template to `submissions/pending/`:

```bash
cp templates/submission_template.json submissions/pending/retail_<topic>_<short_description>.json
```

---

### 3. Fill In Your Use Case

Open the file and complete all five fields:

- **`question`** — What business question does this answer?
- **`context`** — What is the business scenario and who is asking?
- **`business_logic`** — How should this question be answered, in business terms?
- **`tables_used`** — Which tables from the standard schema are involved?
- **`sql`** — What SQL query answers the question? *(optional for non-technical contributors)*

Refer to [DATA_SPEC.md](./DATA_SPEC.md) for detailed guidance on each field.

---

### 4. File Naming Convention

Name your file using this pattern:

```
retail_<topic>_<short_description>.json
```

**Examples:**
- `retail_revenue_category_quarterly_decline.json`
- `retail_inventory_slow_moving_products.json`
- `retail_customers_high_value_segmentation.json`
- `retail_returns_store_rate_comparison.json`
- `retail_forecasting_seasonal_demand.json`

**Rules:**
- Use lowercase only
- Separate words with underscores
- Keep it descriptive but concise (under 60 characters total)
- Always start with `retail_`

---

### 5. Place Your File

Save your completed file to:

```
submissions/pending/
```

Do **not** place files directly in `submissions/reviewed/` or `submissions/rejected/` — those are managed by maintainers.

---

### 6. Open a Pull Request

Commit your file and push to your fork:

```bash
git add submissions/pending/your_filename.json
git commit -m "Add: retail revenue category quarterly decline example"
git push origin main
```

Then go to GitHub and open a **Pull Request** against the `main` branch of this repository.

**In your PR description, briefly include:**
- What retail topic your example covers
- Whether SQL is included
- Any notes on the schema or assumptions made

---

## 📋 Contribution Guidelines

### ✅ Do

- Use **real-world or realistic** retail scenarios
- Write the `question` as a business user would naturally ask it
- Write `business_logic` in plain language — avoid SQL jargon
- Use table and column names from the [standard schema](./DATA_SPEC.md#standard-schema)
- Validate your JSON before submitting (try [jsonlint.com](https://jsonlint.com))
- Include SQL if you are comfortable — it improves dataset quality significantly

### ❌ Don't

- Include **sensitive data** — no real customer names, emails, or PII
- Reference **internal systems** or proprietary company names
- Use **non-standard table names** without noting your schema variation
- Submit **incomplete entries** with empty required fields
- Submit **duplicate** use cases already covered in the examples folder

---

## 🔄 Review Process

1. You submit a PR with your file in `submissions/pending/`
2. A maintainer reviews for quality, correctness, and completeness
3. If approved, it is moved to `submissions/reviewed/` and merged
4. If changes are needed, feedback will be left on the PR
5. If not suitable, it will be moved to `submissions/rejected/` with a reason

We aim to review all PRs within **7 days**.

---

## 💬 Questions?

Open a [GitHub Issue](../../issues) or start a [Discussion](../../discussions) if you have questions about the schema, submission process, or how to frame your use case.

---

*Every contribution — big or small — makes this dataset better. Thank you!* 🙏
