# DATA_SPEC - Query Entry Form

## 1. Overview

### Purpose of the form
The Query Entry form captures high-quality Text-to-SQL training tuples by collecting:
- business intent (`instruction`, `context`)
- analytical targets (`required_metrics_kpis`, `aggregation_logic`)
- reasoning trace (`chain_of_thought`)
- data model hints (`facts`, `dims`, layers)
- optional reference SQL (`sql`)

### Problem it solves
Text-to-SQL systems often fail due to poor or underspecified training data. This form standardizes tuple collection so backend/data teams can curate consistent, machine-consumable examples across domains and database types.

---

## 2. Form Structure Breakdown

| # | Section Name | Description | Fields |
|---|---|---|---|
| 1 | Meta Information | Core tuple metadata and categorization | `q_id` (display-only), `difficulty`, `db_type`, `db_type_other` (conditional), `domain`, `domain_other` (conditional) |
| 2 | Business Question | Natural-language analytics question | `instruction` |
| 3 | Business Context | Business situation and intent background | `context` |
| 4 | Required Metrics & KPIs | List of expected output metrics | `required_metrics_kpis[]` |
| 5 | Aggregation Logic | Metric-to-calculation mapping | `aggregation_rows[]` (UI), transformed into `aggregation_logic` object |
| 6 | Chain of Thought | Ordered reasoning steps used to derive SQL | `chain_of_thought_raw[]` (UI), transformed to `chain_of_thought[]` |
| 7 | Fact Tables | Fact table names used by query | `facts_list[]` (UI), transformed into `data_model.facts` string |
| 8 | Dimension Tables | Dimension table names used by query | `dims_list[]` (UI), transformed into `data_model.dims` string |
| 9 | Data Model Layers | Modeling artifacts and layer hints | `data_model.hierarchies`, `data_model.aggrs`, `data_model.snapshots` |
| 10 | SQL Answer (Optional) | Reference SQL for supervised training/verification | `sql` |
| UI Utility | Live JSON Preview + Copy | Real-time transformed payload visibility and clipboard copy | Derived from all fields, not directly submitted as independent data |

---

## 3. Field-Level Specification (Very Important)

### Legend
- **UI Field Type**: Input control in form.
- **Data Type**: Serialized payload type after processing.

| Field Name | UI Field Type | Data Type | Required | Default | Allowed Values | Validation Rules | Dependencies | Example Input | Example Output |
|---|---|---|---|---|---|---|---|---|---|
| `q_id` | Read-only badge | integer | Yes (system-generated) | `stats.total_tuples + 1`, fallback `1` | Positive integer | Must be `>=1`; auto-assigned | Depends on `api.data.stats()` result | N/A (user cannot edit) | `17` |
| `difficulty` | Dropdown | string (enum) | Yes | `""` | `Easy`, `Medium`, `Hard`, `Expert` | Non-empty selection required | None | `Medium` | `"Medium"` |
| `db_type` | Dropdown | string | Yes | `""` | `BigQuery`, `Snowflake`, `Redshift`, `PostgreSQL`, `MySQL`, `Oracle`, `Azure Synapse`, `Other` | Non-empty selection required | If `Other`, `db_type_other` should be provided (business rule) | `Other` | `"Databricks SQL"` (if `db_type_other` entered) |
| `db_type_other` | Text input (conditional) | string | Conditionally required (recommended) | `""` | Free text | Trimmed non-empty when `db_type == "Other"` (recommended; currently not enforced in code) | Visible only when `db_type="Other"` | `Databricks SQL` | `"Databricks SQL"` |
| `domain` | Dropdown | string | Yes | `""` | `Retail`, `HighTech (SaaS)`, `Healthcare`, `Finance`, `Supply Chain`, `Manufacturing`, `E-Commerce`, `Telecom`, `Education`, `Other` | Non-empty selection required | If `Other`, `domain_other` required | `Finance` | `"Finance"` |
| `domain_other` | Text input (conditional) | string | Yes when `domain="Other"` | `""` | Free text | Trimmed non-empty required when `domain=Other` | Visible only when `domain="Other"` | `Public Sector` | `"Public Sector"` |
| `instruction` | Textarea | string | Yes | `""` | Free text | `trim().length > 0` | None | `What is total MRR by subscription status?` | Same string |
| `context` | Textarea | string | Yes | `""` | Free text | `trim().length > 0` | None | `VP Finance needs revenue health breakdown.` | Same string |
| `required_metrics_kpis[]` | Dynamic list of textareas | array[string] | Yes (at least one non-empty item) | `[""]` | Free text items | At least one item with `trim().length > 0`; empty items removed via `filter(Boolean)` | None | `["Total MRR by Status", "Churn Rate"]` | Same array without empty entries |
| `aggregation_rows[].metric` | Dynamic textarea | string | Yes (section-level: at least one non-empty metric) | `""` | Free text | At least one row must have metric `trim().length > 0` | None | `Total MRR by Status` | Key in `aggregation_logic` |
| `aggregation_rows[].logic` | Dynamic textarea | string | Optional per row (current implementation) | `""` | Free text | No hard validation; preserved as entered | Associated with same row `metric` | `SUM(mrr_usd) grouped by subscription_status` | Value in `aggregation_logic` |
| `aggregation_logic` | Derived object | object (`Record<string,string>`) | Yes (object must have >=1 key) | `{}` | Keys: metric names; values: logic text | Built from rows where `metric` is truthy (not necessarily trimmed) | Derived from `aggregation_rows[]` | Row pairs | `{ "Total MRR by Status": "SUM(mrr_usd) grouped by subscription_status" }` |
| `chain_of_thought_raw[]` | Dynamic list of textareas | array[string] | Yes (at least one non-empty step) | `[""]` | Free text | At least one step with `trim().length > 0` | None | `["Identify fact table", "Group by status"]` | Converted to prefixed steps |
| `chain_of_thought[]` | Derived list | array[string] | Yes | `["Step 1: Others"]` (if empty raw) | Step-prefixed strings | Each output item formatted as `Step N: <trimmed text>`; empty raw -> `Step N: Others` | Derived from `chain_of_thought_raw[]` order | See previous | `["Step 1: Identify fact table", "Step 2: Group by status"]` |
| `facts_list[]` | Dynamic list of textareas | array[string] (UI only) | Yes (section-level) | `[""]` | Free text | At least one non-empty `trim()` entry | None | `["fact_subscriptions"]` | Used to build `data_model.facts` |
| `dims_list[]` | Dynamic list of textareas | array[string] (UI only) | Yes (section-level) | `[""]` | Free text | At least one non-empty `trim()` entry | None | `["dim_customer","dim_date"]` | Used to build `data_model.dims` |
| `data_model.facts` | Derived text | string | Yes (implicitly via section validation) | `""` | Comma-separated table names | Built as `facts_list.filter(Boolean).join(", ")` | Derived from `facts_list[]` | `["fact_subscriptions","fact_orders"]` | `"fact_subscriptions, fact_orders"` |
| `data_model.dims` | Derived text | string | Yes (implicitly via section validation) | `""` | Comma-separated table names | Built as `dims_list.filter(Boolean).join(", ")` | Derived from `dims_list[]` | `["dim_customer","dim_date"]` | `"dim_customer, dim_date"` |
| `data_model.hierarchies` | Text input | string | Optional | `""` | Free text | None in UI | None | `Date > Month > Quarter > Year` | Same string |
| `data_model.aggrs` | Text input | string | Optional | `""` | Free text | None in UI | None | `agg_monthly_revenue` | Same string |
| `data_model.snapshots` | Text input | string | Optional | `""` | Free text | None in UI | None | `snap_inventory_daily` | Same string |
| `sql` | Textarea | string | Optional | `""` | Free text SQL | No validation; can be empty | None | `SELECT ...` | Same string |

---

## 4. Data Model (JSON Schema)

### 4.1 Raw Input JSON (UI-state oriented)
This shape reflects user-entered values before final transformation:

```json
{
  "q_id": 17,
  "difficulty": "Medium",
  "db_type": "Other",
  "db_type_other": "Databricks SQL",
  "domain": "Finance",
  "domain_other": "",
  "instruction": "What is total MRR by subscription status?",
  "context": "VP Finance wants monthly recurring revenue split by status.",
  "required_metrics_kpis": ["Total MRR by Status", ""],
  "aggregation_rows": [
    {
      "metric": "Total MRR by Status",
      "logic": "SUM(mrr_usd) grouped by subscription_status from fact_subscriptions"
    }
  ],
  "chain_of_thought_raw": [
    "Identify fact_subscriptions as source",
    "Group by subscription_status",
    ""
  ],
  "facts_list": ["fact_subscriptions", ""],
  "dims_list": ["dim_customer", "dim_date"],
  "data_model_layers": {
    "hierarchies": "Date > Month > Quarter > Year",
    "aggrs": "agg_monthly_revenue",
    "snapshots": ""
  },
  "sql": "SELECT subscription_status, SUM(mrr_usd) AS total_mrr_usd FROM fact_subscriptions GROUP BY subscription_status;"
}
```

### 4.2 Processed/Final JSON (submitted payload)
This is the actual payload produced by `buildObj()` and sent through `api.data.create(...)`:

```json
{
  "q_id": 17,
  "domain": "Finance",
  "difficulty": "Medium",
  "db_type": "Databricks SQL",
  "instruction": "What is total MRR by subscription status?",
  "context": "VP Finance wants monthly recurring revenue split by status.",
  "required_metrics_kpis": ["Total MRR by Status"],
  "aggregation_logic": {
    "Total MRR by Status": "SUM(mrr_usd) grouped by subscription_status from fact_subscriptions"
  },
  "chain_of_thought": [
    "Step 1: Identify fact_subscriptions as source",
    "Step 2: Group by subscription_status",
    "Step 3: Others"
  ],
  "data_model": {
    "facts": "fact_subscriptions",
    "dims": "dim_customer, dim_date",
    "hierarchies": "Date > Month > Quarter > Year",
    "aggrs": "agg_monthly_revenue",
    "snapshots": ""
  },
  "sql": "SELECT subscription_status, SUM(mrr_usd) AS total_mrr_usd FROM fact_subscriptions GROUP BY subscription_status;"
}
```

### 4.3 JSON Schema (Draft 2020-12)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/dataset-payload.schema.json",
  "title": "DatasetPayload",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "q_id",
    "domain",
    "difficulty",
    "db_type",
    "instruction",
    "context",
    "required_metrics_kpis",
    "aggregation_logic",
    "chain_of_thought",
    "data_model",
    "sql"
  ],
  "properties": {
    "q_id": { "type": "integer", "minimum": 1 },
    "domain": { "type": "string", "minLength": 1 },
    "difficulty": {
      "type": "string",
      "enum": ["Easy", "Medium", "Hard", "Expert"]
    },
    "db_type": { "type": "string", "minLength": 1 },
    "instruction": { "type": "string", "minLength": 1 },
    "context": { "type": "string", "minLength": 1 },
    "required_metrics_kpis": {
      "type": "array",
      "minItems": 1,
      "items": { "type": "string", "minLength": 1 }
    },
    "aggregation_logic": {
      "type": "object",
      "minProperties": 1,
      "additionalProperties": { "type": "string" }
    },
    "chain_of_thought": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "string",
        "pattern": "^Step\\s+\\d+:\\s+.+$"
      }
    },
    "data_model": {
      "type": "object",
      "additionalProperties": false,
      "required": ["facts", "dims", "hierarchies", "aggrs", "snapshots"],
      "properties": {
        "facts": { "type": "string", "minLength": 1 },
        "dims": { "type": "string", "minLength": 1 },
        "hierarchies": { "type": "string" },
        "aggrs": { "type": "string" },
        "snapshots": { "type": "string" }
      }
    },
    "sql": { "type": "string" }
  }
}
```

---

## 5. Validation Rules

### Global validation rules
- Submit is blocked when any required section fails validation.
- Errors are tracked as section flags (`meta`, `instruction`, `context`, `metrics`, `aggregation`, `cot`, `facts`, `dims`).
- Required checks rely primarily on non-empty trimmed strings at section level.

### Field-level validation rules
- **Meta section**: `difficulty`, `db_type`, `domain` required; `domain_other` required if domain is `Other`.
- **Business question/context**: must be non-empty after trim.
- **Metrics**: at least one non-empty item.
- **Aggregation logic**: at least one row with non-empty metric.
- **Chain of thought**: at least one non-empty raw step.
- **Fact/Dim tables**: each section needs at least one non-empty entry.
- **SQL answer**: optional.

### Cross-field validation (important)
- `domain == "Other"` -> `domain_other` must be non-empty; output `domain = domain_other.trim()`.
- `db_type == "Other"` -> output `db_type = db_type_other`; currently not hard-validated (should be enforced in production backend validator).
- `aggregation_logic` keys should match metric names in `required_metrics_kpis` (recommended QA rule; not enforced in UI code).
- `chain_of_thought` step ordering is positional and auto-renumbered by array order.

---

## 6. Business Logic

### Transformations applied
1. **Domain resolution**  
   `resolvedDomain = (domain === "Other") ? domain_other.trim() : domain`

2. **DB type resolution**  
   `db_type = (db_type === "Other") ? db_type_other : db_type`

3. **Metrics cleanup**  
   `required_metrics_kpis = metrics.filter(Boolean)`  
   (removes empty-string entries)

4. **Aggregation conversion**  
   Convert row array into object:
   - include only rows where `metric` is truthy
   - shape: `{ [metric]: logic }`

5. **Chain-of-thought normalization**  
   Every element converted to `Step N: <text>`; blank step becomes `Step N: Others`.

6. **Data-model flattening for tables**  
   - `facts` and `dims` lists serialized as comma-separated strings.
   - `hierarchies`, `aggrs`, `snapshots` passed through unchanged.

### Conditional logic
- `domain_other` input rendered only if `domain = Other`.
- `db_type_other` input rendered only if `db_type = Other`.
- Chain-of-thought delete button shown only when step count > 1.

### Derived fields
- `q_id`: derived from current stored total + 1.
- `chain_of_thought` output array: derived from raw step entries.
- `data_model.facts/dims`: derived from list fields.

---

## 8. Example End-to-End Flow

1. **User fills form**
   - Difficulty: `Easy`
   - DB Type: `Snowflake`
   - Domain: `HighTech (SaaS)`
   - Adds metrics, aggregation rows, COT steps, tables, and SQL.

2. **Data captured in UI state**
   - Dynamic arrays may contain blank entries.
   - `q_id` shown as auto-assigned.

3. **Validation applied**
   - Required sections checked.
   - If any missing required section -> toast error + red highlight.

4. **Transformation**
   - Filter empty metrics.
   - Convert aggregation row list to object.
   - Prefix COT steps with `Step N:`.
   - Join facts/dims arrays into CSV strings.

5. **Final output JSON**
   - Sent to `api.data.create`.
   - Stored as `DatasetRecord` with `id`, `created_at`, and `submitted_at`.

---

## 9. Edge Cases

| Edge Case | Input Pattern | Expected System Behavior | Risk | Recommended Hardening |
|---|---|---|---|---|
| `db_type = Other` but blank `db_type_other` | Dropdown=`Other`, text empty | Submission currently may pass with empty `db_type` value in payload | Data quality degradation | Add validation: require `db_type_other.trim()` when `db_type=Other` |
| Aggregation row with metric but blank logic | `"metric":"Total X", "logic":""` | Allowed; stored with empty string value | Ambiguous computation semantics | Add non-empty logic validation per non-empty metric |
| Metric names duplicated | Two rows with same metric key | Last row overwrites previous during object conversion | Silent data loss | Enforce unique metric keys |
| Metrics and aggregation key mismatch | KPI list differs from aggregation keys | UI allows; no mismatch warning | Inconsistent tuple semantics | Add cross-check validation |
| Whitespace-only entries | `"   "` in list item | Section validation trims for "at least one", but `filter(Boolean)` can keep non-trimmed strings in some paths | Dirty payload values | Normalize with `.map(v => v.trim()).filter(Boolean)` |
| Empty chain steps among valid steps | `["valid","","valid"]` | Blank converted to `"Step N: Others"` | Generic reasoning noise | Allow but flag in QA |
| Trailing/leading spaces in domain other | `"  Public Sector  "` | Trimmed for `domain`, stored clean | Low risk | Keep as-is (good behavior) |
| Manual clear after errors | Click `Clear Form` | Resets all fields and errors | None | Current behavior is correct |

---

## 10. Copy-Ready Sample Data

### 10.1 Valid Case

```json
{
  "q_id": 101,
  "domain": "HighTech (SaaS)",
  "difficulty": "Easy",
  "db_type": "Snowflake",
  "instruction": "What is the monthly MRR trend for active subscriptions in 2025?",
  "context": "Finance leadership wants monthly recurring revenue trend to compare growth targets.",
  "required_metrics_kpis": ["Monthly MRR", "MoM Growth %"],
  "aggregation_logic": {
    "Monthly MRR": "SUM(mrr_usd) grouped by billing_month from fact_subscriptions where subscription_status = 'active'",
    "MoM Growth %": "(current_month_mrr - previous_month_mrr) / NULLIF(previous_month_mrr,0)"
  },
  "chain_of_thought": [
    "Step 1: Filter active subscriptions in 2025 from fact_subscriptions",
    "Step 2: Aggregate SUM(mrr_usd) by billing_month",
    "Step 3: Compute month-over-month growth using lagged monthly totals",
    "Step 4: Order chronologically by billing_month"
  ],
  "data_model": {
    "facts": "fact_subscriptions",
    "dims": "dim_date, dim_customer",
    "hierarchies": "Date > Month > Quarter > Year",
    "aggrs": "agg_mrr_monthly",
    "snapshots": "snap_subscription_status_daily"
  },
  "sql": "SELECT d.month_start, SUM(f.mrr_usd) AS monthly_mrr FROM fact_subscriptions f JOIN dim_date d ON f.date_key = d.date_key WHERE f.subscription_status = 'active' AND d.year = 2025 GROUP BY d.month_start ORDER BY d.month_start;"
}
```

### 10.2 Invalid Case (missing required fields + enum violation)

```json
{
  "q_id": 102,
  "domain": "",
  "difficulty": "Beginner",
  "db_type": "",
  "instruction": "   ",
  "context": "",
  "required_metrics_kpis": [],
  "aggregation_logic": {},
  "chain_of_thought": [],
  "data_model": {
    "facts": "",
    "dims": "",
    "hierarchies": "",
    "aggrs": "",
    "snapshots": ""
  },
  "sql": ""
}
```

### 10.3 Edge Case (form-acceptable but quality-risk)

```json
{
  "q_id": 103,
  "domain": "Other",
  "difficulty": "Hard",
  "db_type": "Other",
  "instruction": "Revenue by plan tier",
  "context": "Need quick view",
  "required_metrics_kpis": ["Total Revenue", "   "],
  "aggregation_logic": {
    "Total Revenue": ""
  },
  "chain_of_thought": [
    "Step 1: Others"
  ],
  "data_model": {
    "facts": "fact_billing",
    "dims": "dim_plan",
    "hierarchies": "",
    "aggrs": "",
    "snapshots": ""
  },
  "sql": ""
}
```

**Why edge case:** this can pass parts of current client validation but still produce weak training data (blank custom db type, empty aggregation logic text, generic reasoning).

---

## Appendix: Storage and Consumption Notes

- Persisted records are stored in local browser storage under `text2sql.datasets`.
- Record envelope:
  - top-level: `id`, `domain`, `created_at`
  - payload: `data_json` (submitted tuple + `submitted_at`)
- Admin/list/search features consume:
  - `domain`, `instruction`, `sql` for text search
  - `difficulty` for filtering
- Export endpoints/functions emit JSON files for downstream curation pipelines.
