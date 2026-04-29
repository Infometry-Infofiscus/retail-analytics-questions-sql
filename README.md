# 🛒 Retail Analytics Text-to-SQL Dataset

> A community-driven, open dataset of real-world retail analytics use cases for training and benchmarking text-to-SQL systems.

---

## 📌 What Is This Project?

This repository collects structured retail analytics examples — each pairing a **natural language business question** with its corresponding **SQL query**, reasoning, and schema context.

The goal: build a high-quality, diverse dataset that helps improve systems translating natural language into SQL — so business users, analysts, and AI systems can interact with retail data more effectively.

---

## 💡 Why This Dataset Matters

Most text-to-SQL benchmarks use synthetic or academic data. Real-world retail analytics involves:

- Complex joins across fact and dimension tables
- Business-specific terminology (e.g., "slow-moving inventory", "high-value customers")
- Nuanced logic (e.g., return rate benchmarking, cohort revenue, seasonality indexing)
- Domain knowledge that generic datasets simply don't capture

By contributing your real use cases, you help close that gap.

---

## 👥 Who Should Contribute?

- **Data Analysts** who write SQL against retail data warehouses
- **BI Engineers** building dashboards and reports
- **Data Scientists** working with retail transaction data
- **Retail Domain Experts** who understand the business problems behind the queries
- **Anyone** who has ever turned a business question into a SQL query

---

## 📦 What to Contribute

Each contribution is a JSON file with the following structure:

| Field | Required | Description |
|---|---|---|
| `domain` | ✅ | Business domain (e.g. Retail, Finance, Healthcare) |
| `difficulty` | ✅ | Query complexity: `Easy` / `Medium` / `Hard` / `Expert` |
| `db_type` | ✅ | Target database: BigQuery, Snowflake, Redshift, PostgreSQL, etc. |
| `instruction` | ✅ | Natural language business question |
| `context` | ✅ | Who is asking and what decision it informs |
| `required_metrics_kpis` | ✅ | List of KPI names the query must produce |
| `aggregation_logic` | ✅ | KPI name → aggregation formula mapping |
| `chain_of_thought` | ⬜ | Step-by-step reasoning behind the query |
| `data_model.facts` | ✅ | Fact tables used (comma-separated) |
| `data_model.dims` | ✅ | Dimension tables used (comma-separated) |
| `data_model.hierarchies` | ✅ | e.g. `Date > Month > Year` |
| `data_model.aggrs` | ✅ | Named aggregation layers used |
| `data_model.snapshots` | ✅ | Snapshot tables if applicable |
| `sql` | ⬜ | The SQL query answering the question |

See [DATA_SPEC.md](./DATA_SPEC.md) for full field definitions, validation rules, and allowed dropdown values.

---

## 📝 Example Contribution

```json
{
  "domain": "Retail",
  "difficulty": "Medium",
  "db_type": "Snowflake",
  "instruction": "Which product categories had declining revenue in Q4 compared to Q3?",
  "context": "The merchandising team wants to identify underperforming categories before annual planning.",
  "required_metrics_kpis": [
    "Q4 Revenue by Category",
    "Q3 Revenue by Category"
  ],
  "aggregation_logic": {
    "Q4 Revenue by Category": "SUM(net_sales) WHERE quarter = 4, grouped by category",
    "Q3 Revenue by Category": "SUM(net_sales) WHERE quarter = 3, grouped by category"
  },
  "chain_of_thought": [
    "Identify categories with net sales in both Q3 and Q4 of the same year.",
    "Aggregate net_sales per category per quarter using conditional SUM.",
    "Filter to rows where Q4 revenue is less than Q3 revenue using HAVING.",
    "Order by revenue decline magnitude ascending to surface worst performers first."
  ],
  "data_model": {
    "facts": "fact_sales",
    "dims": "dim_product, dim_date",
    "hierarchies": "Date > Quarter > Year, Product > Category",
    "aggrs": "agg_quarterly_category_revenue",
    "snapshots": ""
  },
  "sql": "SELECT p.category, SUM(CASE WHEN d.quarter = 4 THEN s.net_sales END) AS q4_revenue, SUM(CASE WHEN d.quarter = 3 THEN s.net_sales END) AS q3_revenue FROM fact_sales s JOIN dim_product p ON s.product_id = p.product_id JOIN dim_date d ON s.date_id = d.date_id WHERE d.year = 2024 GROUP BY p.category HAVING q4_revenue < q3_revenue ORDER BY (q4_revenue - q3_revenue) ASC;"
}
```

---

## 🗂️ Standard Schema Reference

All contributions should use the standard retail schema below. This keeps the dataset consistent and queryable across contributions.

| Table | Type | Key Columns |
|---|---|---|
| `fact_sales` | Fact | `sale_id`, `customer_id`, `product_id`, `store_id`, `date_id`, `net_sales`, `quantity`, `is_return` |
| `dim_product` | Dimension | `product_id`, `product_name`, `category`, `sub_category`, `brand`, `unit_cost` |
| `dim_customer` | Dimension | `customer_id`, `customer_segment`, `acquisition_channel`, `region` |
| `dim_store` | Dimension | `store_id`, `store_name`, `city`, `region`, `opening_date` |
| `dim_date` | Dimension | `date_id`, `full_date`, `week`, `month`, `quarter`, `year` |

---

## 🚀 How to Contribute

### Option A — UI Form *(Recommended)*

1. Open the **[Query Entry Form](https://infometry-infofiscus.github.io/text2sql_data_collection_platform/)** in your browser
2. Fill in all required fields — the Live JSON panel updates in real time
3. Copy the generated JSON from the Live JSON panel
4. Save as a `.json` file following the naming convention below
5. Place in `submissions/pending/` and open a Pull Request

### Option B — Manual JSON

1. **Fork** this repository
2. **Copy** `templates/submission_template.json`
3. **Fill in** all required fields following [DATA_SPEC.md](./DATA_SPEC.md)
4. **Name your file** using the convention below
5. **Place** in `submissions/pending/` and open a Pull Request

### Option C — Markdown First

1. **Copy** `templates/submission_template.md`
2. **Fill in** all sections in plain English
3. Convert to JSON using the template and submit as above

### File Naming Convention

```
<domain>_<topic>_<short_description>.json
```

Examples:
- `retail_inventory_slow_movers.json`
- `retail_customer_vip_acquisition_channel.json`
- `finance_mrr_subscription_status.json`

---

## ✅ Contribution Quality Checklist

Before submitting, verify:

- [ ] All required sections filled (Meta, Instruction, Context, Metrics & Aggregation, Schema Tables, Data Model Layers)
- [ ] `required_metrics_kpis` list matches keys in `aggregation_logic` object
- [ ] `data_model.facts` and `data_model.dims` are non-empty
- [ ] SQL (if provided) runs against the standard schema without errors
- [ ] File named following the naming convention
- [ ] No proprietary, internal, or PII data included

---

## 📚 Resources

| Resource | Description |
|---|---|
| 🌐 [UI Form](https://infometry-infofiscus.github.io/text2sql_data_collection_platform/) | Browser-based form — easiest way to draft a submission |
| 📋 [DATA_SPEC.md](./DATA_SPEC.md) | Full field spec, validation rules, allowed dropdown values |
| 📁 [examples/](./examples/) | High-quality example contributions to learn from |
| 🖊️ [templates/](./templates/) | JSON and Markdown templates to get started |

---

## 🌟 Join the Community

Every contribution — simple or complex — helps build a better foundation for retail AI. A basic sales aggregation and a multi-CTE seasonality analysis are both valuable.

**Star ⭐ this repo** to stay updated. **Share it** with your data team. **Open an issue** if you have questions or want to propose new schema tables.

---

*No proprietary data. No internal systems. Just real-world retail knowledge, shared openly.*