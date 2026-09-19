# Patient Risk & Follow-Up Dashboard

A prototype web app for clinicians that stratifies patients into **High /
Medium / Low risk** using the **LACE Index**, and flags patients whose
follow-up is **overdue** or **due soon** so care teams can prioritize
outreach.

> This is a demo/prototype: it runs entirely in the browser, uses no real
> patient data by default, and is not a certified clinical decision tool.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL, then either upload a patient dataset workbook
(`.xlsx`) or click **Load sample data** to try it with a synthetic
100-patient heart failure dataset.

## How it works

1. Upload a workbook matching the schema below (see
   [`public/heart-failure-sample-dataset.xlsx`](public/heart-failure-sample-dataset.xlsx)
   for a full example).
2. For each patient, their **most recent visit** anchors a **LACE score**,
   computed client-side:
   - **L** — Length of stay on that visit
   - **A** — Acuity of admission (3 points if the visit was Inpatient or
     Emergency, 0 for outpatient encounters)
   - **C** — Comorbidity burden, via the Charlson Comorbidity Index,
     computed from the patient's active ICD-10-coded conditions using the
     standard Quan (2005) ICD-10 coding algorithm
   - **E** — Number of Emergency visits in the 6 months before that visit
3. The total LACE score (0–19) buckets each patient into a risk tier:
   High (≥10), Medium (5–9), Low (0–4).
4. Follow-up due date comes from the earliest `NextFollowUpDate` recorded
   in an outpatient consult tied to the patient's most recent visit. If
   the most recent visit was a hospitalization with no follow-up visit on
   record yet, a due date is inferred from the discharge date and risk
   tier (High: 7 days, Medium: 14 days, Low: 30 days). Status (Overdue /
   Due soon / Scheduled) compares that due date to today.
5. A **clinical snapshot** panel per patient (HF type/etiology, NYHA
   class, LVEF, latest vitals, key labs, active comorbidities, current
   medication classes) is built from the rest of the workbook for
   clinical context — it doesn't feed the risk score.
6. The dashboard shows summary counts, and a sortable/filterable table you
   can drill into for a per-patient score breakdown.

All data stays in the browser — nothing is uploaded to a server.

> **Note on the bundled sample data:** it's a static historical export
> (encounters from 2024–2026), and most patients' most recent recorded
> visit is already months old relative to today. That means most sample
> patients will correctly show as **Overdue** — the app is accurately
> reporting a real care gap in the data, not malfunctioning. A live EHR
> export, where patients' most recent visits are actually recent, would
> show the intended spread across Overdue / Due soon / Scheduled.

## Workbook schema

| Sheet | Required | Grain | Key columns used |
| --- | --- | --- | --- |
| `1_Patients` | Yes | One row per patient | `PatientID`, `FirstName`, `LastName`, `Gender`, `Age`, `HF_Type`, `HF_Etiology`, `BaselineLVEF_pct`, `NYHA_Class_Baseline` |
| `1b_Comorbidities` | Yes | One row per patient-condition | `PatientID`, `ICD10_Code`, `Condition`, `Status` |
| `2_Visits` | Yes | One row per encounter | `VisitID`, `PatientID`, `VisitType`, `AdmitOrVisitDate`, `DischargeDate`, `LengthOfStay_days`, vitals, `Disposition` |
| `3c_OP_Consultations` | Yes | One row per outpatient consult | `VisitID`, `PatientID`, `NextFollowUpDate` |
| `3a_LabResults` | Optional | One row per lab result | Feeds the clinical snapshot's key labs (BNP, NT-proBNP, Creatinine, eGFR, Sodium, Potassium) |
| `3d_Medications` | Optional | One row per medication order | Feeds the clinical snapshot's current medication classes (scoped to the latest visit) |
| `4_Physicians` | Optional | One row per physician | Resolves the attending physician's name for display |

Header names are matched exactly as in the sample workbook. Dates should be
real Excel dates (not text).

## Tech stack

React + TypeScript + Vite + Tailwind CSS, with [exceljs](https://github.com/exceljs/exceljs)
for client-side `.xlsx` parsing (chosen over SheetJS's `xlsx` npm package,
which currently ships unpatched high-severity CVEs). Risk/follow-up logic
lives in `src/lib/` as plain, unit-testable functions, independent of the
UI:

- `xlsxImport.ts` — reads the workbook into typed rows per sheet
- `charlsonIcd10.ts` — ICD-10 → Charlson Comorbidity Index mapping
- `lace.ts` / `followup.ts` — the scoring and follow-up-status logic
- `buildDashboard.ts` — joins everything into one result per patient

## Roadmap ideas

- Persist uploaded data (currently in-memory only, cleared on refresh)
- CSV export of the filtered/flagged list for outreach worklists
- Configurable risk cutoffs and follow-up windows per care team
- Support for additional risk models beyond LACE
- Use `3b_Procedures` and full lab/medication history, not just the latest snapshot
