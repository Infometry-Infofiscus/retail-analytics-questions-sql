# Retail Analytics Use Case Submission

Use this template to describe your retail analytics use case. Fill in each section below, then convert to JSON using `templates/submission_template.json` before placing in `submissions/pending/`.

---

## Question

*Write the business question here as a real user would ask it.*

> Example: "Which stores had the highest return rate last quarter?"

---

## Context

*Describe the business scenario. Who is asking this question? What decision will the answer inform?*

> Example: "The regional operations team is conducting a quarterly performance review and wants to identify stores with abnormal return rates before meeting with store managers."

---

## Business Logic

*Explain in plain language how to answer this question. What calculations, filters, or rules apply? Avoid referencing SQL syntax.*

> Example: "Return rate is calculated as the number of returned transactions divided by total transactions. Only stores open for the full quarter are included. Stores are ranked from highest to lowest return rate."

---

## Tables Used

*List the tables from the standard schema that are needed to answer this question.*

- [ ] fact_sales
- [ ] dim_product
- [ ] dim_store
- [ ] dim_date
- [ ] dim_customer

---

## SQL Query

*Paste your SQL query here. This field is optional but strongly encouraged.*

```sql
-- Your SQL here
```

---

## Notes (Optional)

*Any additional notes about assumptions, schema variations, or edge cases.*

---

*When you're ready, convert this to JSON format and save your file as:*
`submissions/pending/retail_<topic>_<short_description>.json`
