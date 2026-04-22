# 🛒 Retail Analytics Text-to-SQL Dataset

> A community-driven, open dataset of real-world retail analytics use cases for training and benchmarking text-to-SQL systems.

---

## 📌 What Is This Project?

This repository collects structured retail analytics examples — each pairing a **business question** with its corresponding **SQL query**, context, and reasoning.

The goal is to build a high-quality, diverse dataset that helps improve systems that translate natural language questions into SQL — enabling business users, analysts, and AI systems to interact with retail data more effectively.

---

## 💡 Why This Dataset Matters

Most text-to-SQL benchmarks use synthetic or academic data. Real-world retail analytics involves:

- Complex joins across fact and dimension tables
- Business-specific terminology (e.g., "slow-moving inventory", "high-value customers")
- Nuanced logic (e.g., calculating return rates, cohort-based revenue)
- Domain knowledge that generic datasets don't capture

By contributing your real use cases, you help close that gap.

---

## 👥 Who Should Contribute?

- **Data Analysts** who write SQL against retail data warehouses
- **Business Intelligence Engineers** building dashboards and reports
- **Data Scientists** working with retail transaction data
- **Retail Domain Experts** who understand the business problems behind the queries
- **Anyone** who has ever asked a business question and translated it into SQL!

---

## 📦 What to Contribute

Each contribution is a JSON file containing:

| Field | Description |
|---|---|
| `question` | A natural language business question |
| `context` | Background about the business scenario |
| `business_logic` | Why the query is structured the way it is |
| `tables_used` | List of tables involved |
| `sql` | The SQL query that answers the question |

See [DATA_SPEC.md](./DATA_SPEC.md) for full field definitions and requirements.

---

## 📝 Example Contribution

```json
{
  "question": "Which product categories had declining revenue in Q4 compared to Q3?",
  "context": "The merchandising team wants to identify underperforming categories before annual planning.",
  "business_logic": "Revenue is compared quarter-over-quarter by summing net sales per category. A decline is flagged when Q4 revenue is lower than Q3 revenue for the same year.",
  "tables_used": ["fact_sales", "dim_product", "dim_date"],
  "sql": "SELECT p.category, SUM(CASE WHEN d.quarter = 4 THEN s.net_sales END) AS q4_revenue, SUM(CASE WHEN d.quarter = 3 THEN s.net_sales END) AS q3_revenue FROM fact_sales s JOIN dim_product p ON s.product_id = p.product_id JOIN dim_date d ON s.date_id = d.date_id WHERE d.year = 2024 GROUP BY p.category HAVING q4_revenue < q3_revenue ORDER BY (q4_revenue - q3_revenue) ASC;"
}
```

---

## 🚀 How to Contribute

1. **Fork** this repository
2. **Copy** `templates/submission_template.json` or `templates/submission_template.md`
3. **Fill in** all required fields with your use case
4. **Name your file** using the convention: `retail_<topic>_<short_description>.json`  
   *(e.g., `retail_inventory_slow_movers.json`)*
5. **Place** your file in `submissions/pending/`
6. **Open a Pull Request** with a short description of your contribution
7. A maintainer will review and move it to `reviewed/` or provide feedback

---

## 📚 Resources

- 📋 [DATA_SPEC.md](./DATA_SPEC.md) — Full data specification and field guide
- 📁 [examples/](./examples/) — Browse 5 high-quality example contributions
- 🖊️ [templates/](./templates/) — JSON and Markdown templates to get started
- 🌐 [UI Form](https://anubhavkumargupta.github.io/text2sql_data_collection_platform/) — Browser-based form for easy submission drafting

---

## 🌟 Join the Community

Every contribution — no matter how simple — helps build a better foundation for retail AI. Whether it's a basic sales query or a complex multi-dimensional analysis, your use case has value.

**Star ⭐ this repo** to stay updated, and **share it** with your data team!

---

*This project is open to all. No proprietary data, no internal systems — just real-world retail knowledge, shared openly.*
