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
| 4 | Metrics & Aggregation | Yes | `aggregation_rows[].metric`, `aggregation_rows[].logic` |
| 5 | Schema Tables | Yes | `facts_list[]`, `dims_list[]` |
| 6 | Chain of Thought | Optional | `chain_of_thought_raw[]` |
| 7 | Data Model Layers | Optional | `data_model.hierarchies`, `data_model.aggrs`, `data_model.snapshots` |
| 8 | SQL Answer | Optional | `sql` |

Notes from UI:
- Footer shows `0/8 required fields`, so only required sections should block submit.
- `Chain of Thought` and `SQL Answer` display an Optional badge.
- `Schema Tables` contains both Fact and Dimension table inputs in a single section.

---

## 3. Field-Level Specification

| Field | UI Control | Data Type | Required | Validation |
|---|---|---|---|---|
| `difficulty` | Dropdown | string | Yes | Must be selected (non-empty). |
| `db_type` | Dropdown | string | Yes | Must be selected (non-empty). |
| `domain` | Dropdown | string | Yes | Must be selected (non-empty). |
| `instruction` | Textarea | string | Yes | `trim().length > 0`. |
| `context` | Textarea | string | Yes | `trim().length > 0`. |
| `aggregation_rows[].metric` | Text input/textarea (dynamic rows) | string | Yes (section-level) | At least one row must have non-empty metric. |
| `aggregation_rows[].logic` | Text input/textarea (dynamic rows) | string | Yes (section-level with metric pair) | For each non-empty metric, logic should be non-empty. |
| `facts_list[]` | Dynamic list | array[string] | Yes | At least one non-empty fact table value. |
| `dims_list[]` | Dynamic list | array[string] | Yes | At least one non-empty dimension table value. |
| `chain_of_thought_raw[]` | Dynamic list | array[string] | No | If provided, keep non-empty steps in input order. |
| `data_model.hierarchies` | Text input | string | No | Free text. |
| `data_model.aggrs` | Text input | string | No | Free text. |
| `data_model.snapshots` | Text input | string | No | Free text. |
| `sql` | SQL textarea | string | No | Free text SQL; can be blank. |

---

## 4. Canonical Payload Shape

```json
{
  "difficulty": "Medium",
  "db_type": "Snowflake",
  "domain": "Retail",
  "instruction": "What is total MRR broken down by subscription status?",
  "context": "Finance team needs a quick MRR snapshot to assess revenue health.",
  "aggregation_logic": {
    "Total MRR by Status": "SUM(mrr_usd) grouped by subscription_status"
  },
  "chain_of_thought": [
    "Identify source fact table",
    "Group by subscription status"
  ],
  "data_model": {
    "facts": "fact_subscriptions",
    "dims": "dim_customer, dim_date",
    "hierarchies": "Date > Month > Year",
    "aggrs": "agg_monthly_revenue",
    "snapshots": "snap_inventory_daily"
  },
  "sql": "SELECT subscription_status, SUM(mrr_usd) AS total_mrr FROM fact_subscriptions GROUP BY 1;"
}
```

---

## 5. Transformation Rules

1. Build `aggregation_logic` from row pairs:
   - key = metric name (trimmed)
   - value = aggregation formula (trimmed)
   - ignore rows where metric is blank
2. Convert `facts_list[]` to `data_model.facts` as comma-separated string.
3. Convert `dims_list[]` to `data_model.dims` as comma-separated string.
4. If chain-of-thought is optional and empty, submit `[]` or omit based on backend contract.
5. Preserve optional sections as empty strings only if backend requires keys to exist.

---

## 6. Validation Contract (UI-Aligned)

Submission should fail when any required section is incomplete:
- Meta section missing any of: `difficulty`, `db_type`, `domain`
- `instruction` is blank
- `context` is blank
- no valid metric+formula pair in Metrics & Aggregation
- no fact table value
- no dimension table value

Submission should still pass when:
- Chain of Thought is blank
- Data Model Layers are blank
- SQL Answer is blank

---

## 7. Required vs Optional Summary

- **Required:** Meta, Business Question, Business Context, Metrics & Aggregation, Schema Tables (facts and dims)
- **Optional:** Chain of Thought, Data Model Layers, SQL Answer

This matches the visible UI badges and the required-field counter behavior.
