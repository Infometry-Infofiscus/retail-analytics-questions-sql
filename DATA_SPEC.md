# DATA_SPEC - Query Entry Form (UI-Aligned)

## 1. Purpose

This form collects high-quality Text-to-SQL training entries by capturing:
- business intent
- required metrics and aggregation logic
- schema/table references
- optional reasoning steps
- optional reference SQL

The specification below reflects the current UI layout and labels shown in the Query Entry screen.

---

## 2. UI Section Map

| # | UI Section | Required in UI | Fields |
|---|---|---|---|
| 1 | Meta | Yes | `difficulty`, `db_type`, `domain` |
| 2 | Business Question | Yes | `instruction` |
| 3 | Business Context | Yes | `context` |
| 4 | Metrics & Aggregation | Yes | `required_metrics_kpis[]`, `aggregation_logic{}` |
| 5 | Chain of Thought | Optional | `chain_of_thought[]` |
| 6 | Schema Tables | Yes | `data_model.facts`, `data_model.dims` |
| 7 | Data Model Layers | Yes | `data_model.hierarchies`, `data_model.aggrs`, `data_model.snapshots` |
| 8 | SQL Answer | Optional | `sql` |

Notes from UI:
- Footer shows `0/8 required fields` — 8 sections total, only Chain of Thought (5) and SQL Answer (8) carry Optional badge.
- Schema Tables and Data Model Layers are both part of a single `data_model` object in the output payload.
- Fact and Dimension table inputs (section 6) serialize to `data_model.facts` and `data_model.dims` as comma-separated strings.

---

## 3. Field-Level Specification

| Field | UI Control | Data Type | Required | Validation |
|---|---|---|---|---|
| `difficulty` | Dropdown | string | Yes | One of: Easy, Medium, Hard, Expert |
| `db_type` | Dropdown | string | Yes | One of: BigQuery, Snowflake, Redshift, PostgreSQL, MySQL, Oracle, Azure Synapse, Other |
| `domain` | Dropdown | string | Yes | One of: Retail, Healthcare, HighTech (SaaS), Finance, Manufacturing, Supply Chain, Other |
| `instruction` | Textarea | string | Yes | `trim().length > 0` |
| `context` | Textarea | string | Yes | `trim().length > 0` |
| `required_metrics_kpis[]` | Dynamic rows (metric name col) | array[string] | Yes | At least one non-empty KPI name |
| `aggregation_logic{}` | Dynamic rows (formula col) | object | Yes | Each KPI name must have a paired non-empty formula |
| `chain_of_thought[]` | Dynamic list | array[string] | No | If provided, preserve non-empty steps in input order |
| `data_model.facts` | Dynamic list → serialized | string | Yes | At least one fact table; comma-separated |
| `data_model.dims` | Dynamic list → serialized | string | Yes | At least one dimension table; comma-separated |
| `data_model.hierarchies` | Text input | string | Yes | Free text |
| `data_model.aggrs` | Text input | string | Yes | Free text |
| `data_model.snapshots` | Text input | string | Yes | Free text |
| `sql` | SQL textarea | string | No | Free text SQL; can be blank |

---

## 4. Canonical Payload Shape

```json
{
  "q_id": 3,
  "difficulty": "Medium",
  "db_type": "Relational (SQL)",
  "domain": "Retail",
  "instruction": "Which products have been sitting in inventory for more than 60 days without a sale, and what is their estimated stock value?",
  "context": "Inventory management team runs monthly review to identify stagnant products. Zero sales in 60+ days ties up capital, consumes warehouse space, risks obsolescence. Report drives decisions on markdowns, clearance promotions, or supplier returns.",
  "metrics_and_aggregation": [
    {
      "kpi_metric_name": "Days Since Last Sale",
      "aggregation_formula": "DATEDIFF(CURRENT_DATE, MAX(last_sale_date)) per product_id"
    },
    {
      "kpi_metric_name": "Units Sold Last 90 Days (Stock Proxy)",
      "aggregation_formula": "SUM(quantity) WHERE full_date >= CURRENT_DATE - 90 days AND is_return = FALSE, grouped by product_id"
    },
    {
      "kpi_metric_name": "Estimated Stagnant Stock Value",
      "aggregation_formula": "ROUND(unit_cost * COALESCE(units_sold_last_90d, 0), 2) per product"
    }
  ],
  "chain_of_thought": [
    "Step 1: Goal is to surface all active products with no sales in 60+ days and estimate their tied-up capital value.",
    "Step 2: Need product master (dim_product), sales transactions (fact_sales), and calendar dates (dim_date). No inventory quantity table exists — use 90-day sales volume as stock proxy.",
    "Step 3: Filter to non-returns only (is_return = FALSE). Active products only from dim_product. Two date windows needed: last sale date (all-time) and 90-day sales volume.",
    "Step 4: Estimated stock value = unit_cost × units_sold_last_90d. COALESCE handles products with zero recent sales. ROUND to 2 decimal places.",
    "Step 5: Results ordered by estimated_stagnant_value DESC — highest capital-at-risk items surface first for prioritized action.",
    "Step 6: HAVING filters to products where last_sale_date IS NULL (never sold) OR days_since_last_sale > 60. LEFT JOINs ensure products with zero sales history are still included.",
    "Step 7: Stock value is a proxy, not actual on-hand quantity. Interpret with caution — high units_sold_last_90d on a stagnant item may indicate a sudden drop-off, not low stock."
  ],
  "schema_tables": {
    "fact_tables": ["fact_sales"],
    "dimension_tables": ["dim_product", "dim_date"]
  },
  "data_model_layers": {
    "hierarchies": "Product > Sub-Category > Category > Brand",
    "aggregations": "agg_slow_moving_inventory_monthly",
    "snapshots": "snap_inventory_stagnant_60d"
  },
  "sql": "SELECT\n  p.product_id,\n  p.product_name,\n  p.category,\n  p.sub_category,\n  p.brand,\n  p.unit_cost,\n  COALESCE(recent.units_sold_last_90d, 0) AS units_sold_last_90d,\n  MAX(last_sale.last_sale_date) AS last_sale_date,\n  DATEDIFF(CURRENT_DATE, MAX(last_sale.last_sale_date)) AS days_since_last_sale,\n  ROUND(p.unit_cost * COALESCE(recent.units_sold_last_90d, 0), 2) AS estimated_stagnant_value\nFROM dim_product p\nLEFT JOIN (\n  SELECT\n    s.product_id,\n    MAX(d.full_date) AS last_sale_date\n  FROM fact_sales s\n  JOIN dim_date d ON s.date_id = d.date_id\n  WHERE s.is_return = FALSE\n  GROUP BY s.product_id\n) last_sale ON p.product_id = last_sale.product_id\nLEFT JOIN (\n  SELECT\n    s.product_id,\n    SUM(s.quantity) AS units_sold_last_90d\n  FROM fact_sales s\n  JOIN dim_date d ON s.date_id = d.date_id\n  WHERE s.is_return = FALSE\n    AND d.full_date >= CURRENT_DATE - INTERVAL '90 days'\n  GROUP BY s.product_id\n) recent ON p.product_id = recent.product_id\nGROUP BY\n  p.product_id, p.product_name, p.category, p.sub_category,\n  p.brand, p.unit_cost, recent.units_sold_last_90d\nHAVING\n  MAX(last_sale.last_sale_date) IS NULL\n  OR DATEDIFF(CURRENT_DATE, MAX(last_sale.last_sale_date)) > 60\nORDER BY estimated_stagnant_value DESC;"
}
```

---

## 5. Transformation Rules

1. Build `required_metrics_kpis` as flat array of KPI name strings (trimmed), one per row.
2. Build `aggregation_logic` as key-value object from same rows:
   - key = metric name (trimmed)
   - value = aggregation formula (trimmed)
   - ignore rows where metric name is blank
3. Convert fact table list → `data_model.facts` as comma-separated string.
4. Convert dimension table list → `data_model.dims` as comma-separated string.
5. `chain_of_thought` — submit as `[]` if empty (always include key).
6. `sql` — submit as `""` if empty (always include key).
7. Preserve all `data_model` keys even if blank — backend expects full object.

---

## 6. Validation Contract (UI-Aligned)

Submission should **fail** when any required section is incomplete:
- Meta: any of `difficulty`, `db_type`, `domain` missing or unselected
- `instruction` is blank
- `context` is blank
- No valid metric + formula pair in Metrics & Aggregation
- No fact table entry in `data_model.facts`
- No dimension table entry in `data_model.dims`

Submission should **pass** when:
- `chain_of_thought` is empty (`[]`)
- `data_model.hierarchies`, `data_model.aggrs`, `data_model.snapshots` are blank strings
- `sql` is blank

---

## 7. Dropdown Allowed Values

### difficulty
`Easy` | `Medium` | `Hard` | `Expert`

### db_type
`BigQuery` | `Snowflake` | `Redshift` | `PostgreSQL` | `MySQL` | `Oracle` | `Azure Synapse` | `Other`

### domain
`Retail` | `Healthcare` | `HighTech (SaaS)` | `Finance` | `Manufacturing` | `Supply Chain` | `Other`

---

## 8. Required vs Optional Summary

| Section | UI Label | Required |
|---|---|---|
| 1 | Meta (difficulty, db_type, domain) | ✅ Yes |
| 2 | Business Question | ✅ Yes |
| 3 | Business Context | ✅ Yes |
| 4 | Metrics & Aggregation | ✅ Yes |
| 5 | Chain of Thought | ⬜ Optional |
| 6 | Schema Tables | ✅ Yes |
| 7 | Data Model Layers | ✅ Yes |
| 8 | SQL Answer | ⬜ Optional |