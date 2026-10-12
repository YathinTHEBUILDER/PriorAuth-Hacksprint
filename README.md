# Prior Authorization Assistant

> **Smarter Documentation. Faster Approvals. Better Patient Care.**  
> A full-stack healthcare platform engineered for healthcare providers to automate clinical document extraction, detect payer guideline gaps, compile compliant prior authorization packets, and track electronic payer adjudication.

---

## 1. Executive Summary & Problem Statement

### The Problem
Physicians and clinical care coordinators spend an estimated **14+ hours per week** manually gathering clinical records, navigating disparate payer guidelines, completing redundant prior authorization forms, and responding to insurer requests for additional information. Missing clinical details (such as conservative therapy durations or recent diagnostic labs) routinely result in care delays, costly administrative appeals, and patient treatment interruptions.

### The Solution
The **Prior Authorization Assistant** automates the end-to-end prior authorization lifecycle:
1. **Clinical Document Ingestion**: Ingests consultation notes, imaging reports, and diagnostic lab results (PDF, images, or manual text).
2. **Deterministic & AI Clinical Extraction**: Accurately extracts diagnoses, ICD-10 codes, CPT/procedure codes, physical exam findings, conservative therapy trials, and provider NPI without clinical hallucinations.
3. **Payer Requirement Gap Detection**: Dynamically evaluates patient clinical evidence against active, configurable payer policy rules and calculates an objective completeness score.
4. **Packet & Real PDF Generation**: Compiles structured prior authorization summaries with evidence checklists and downloadable PDF packets.
5. **Physician Review & Sign-Off**: Enforces clinical verification safeguards before authorization submission.
6. **Simulated Payer Gateway & Tracking**: Dispatches requests to a simulated electronic payer gateway with unique submission references, interactive decision simulation, and status timelines.

---

## 2. Technology Stack

- **Frontend**:
  - **Framework**: React 19 with TypeScript, powered by Vite
  - **Styling**: Tailwind CSS v4, custom glassmorphism design system, responsive healthcare SaaS layout
  - **Icons**: Lucide React
  - **Navigation**: React Router v7
  - **Data Visualization**: Recharts (Trends area charts, status distribution donut charts, payer bar charts)
  - **Notifications**: Custom multi-tier toast notification system

- **Backend**:
  - **Runtime**: Node.js v24 (ES Modules)
  - **Framework**: Express.js with TypeScript & REST architecture
  - **ORM**: Prisma ORM v5
  - **Database**: SQLite (Zero-configuration out-of-the-box local execution) / PostgreSQL compatible
  - **Document Processing**: `pdf-parse` for text extraction & `pdfkit` for high-resolution PDF generation
  - **Security**: JWT session tokens via secure cookies, bcrypt password hashing, role-based access control (RBAC), centralized error handling
  - **Testing**: Vitest automated test suite

---

## 3. System Architecture & Relational Database Models

```
┌────────────────────────────────────────────────────────┐
│             Prior Authorization Assistant              │
│                React 19 + TypeScript                   │
└───────────────────────────┬────────────────────────────┘
                            │ REST API (JSON / Cookies)
┌───────────────────────────▼────────────────────────────┐
│                  Express.js Backend                    │
│   ┌─────────────────┐ ┌───────────────┐ ┌───────────┐  │
│   │   Auth & RBAC   │ │ Clinical NLP  │ │ PDF Engine│  │
│   │ (Admin/Dr/Staff)│ │   AI Service  │ │ (PDFKit)  │  │
│   └─────────────────┘ └───────────────┘ └───────────┘  │
│   ┌─────────────────┐ ┌───────────────┐ ┌───────────┐  │
│   │ Completeness Eng│ │ Payer Gateway │ │ Audit Log │  │
│   │  (Rule Checker) │ │  (Simulator)  │ │ (Tracker) │  │
│   └─────────────────┘ └───────────────┘ └───────────┘  │
└───────────────────────────┬────────────────────────────┘
                            │ Prisma ORM
┌───────────────────────────▼────────────────────────────┐
│       Relational Database (PostgreSQL / SQLite)        │
│ • User                   • ClinicalInformation         │
│ • Organization           • Document                    │
│ • Patient                • ExtractedField              │
│ • Payer                  • RequestRequirementResult    │
│ • PayerProfile           • RequestReview               │
│ • PayerRequirement       • RequestStatusHistory        │
│ • AuthorizationRequest   • Notification & AuditLog     │
└────────────────────────────────────────────────────────┘
```

---

## 4. Demo Account Credentials

The application is pre-seeded with 3 role-differentiated demonstration accounts:

| Role | Name | Demo Email | Password | Permissions |
|---|---|---|---|---|
| **Administrator** | Dr. Eleanor Vance, MD | `admin@priorauth.health` | `Password123!` | User management, payer rule configurations, audit logs, analytics |
| **Doctor** | Dr. Marcus Chen, MD | `doctor@priorauth.health` | `Password123!` | Create requests, review clinical facts, confirm accuracy, sign-off |
| **Staff Coordinator** | Sarah Jenkins, RN | `staff@priorauth.health` | `Password123!` | Upload documents, correct extracted data, prepare drafts |

> **Pro Tip**: The Login screen features **1-Click Quick Demo Login** buttons for instant access to each role.

---

## 5. End-to-End Clinical Demonstration Workflow

Follow these 10 steps to test the application:

1. **Sign In**: Navigate to `http://localhost:5173/login` and click **Dr. Marcus Chen, MD (Doctor)**.
2. **Dashboard**: View high-level metrics, the 8-stage pipeline, recent activity, and distribution charts.
3. **Inspect Existing Request**: Click on `PA-2026-00101` (Robert Davis - Lumbar Spine MRI) to view an active 80% completeness case.
4. **Create a New Request**:
   - Click **New Request** in the header.
   - Select patient **James Wilson (MRN: MRN-640192)** and target payer **UnitedHealthcare**.
   - Click the template button for **Biologic Therapy (Adalimumab / J0135)**.
   - Click **Create & Proceed to Documents**.
5. **Upload Supporting Document**:
   - In Tab 2 (Documents), select category **Laboratory Reports**.
   - Either attach `uploads/sample_biologic_tb_gold_lab.pdf` or paste notes in the manual entry tab.
   - Click **Process & Extract**.
6. **Review Extracted Clinical Facts**:
   - In Tab 3 (Extraction), inspect the structured fields (Diagnosis, CPT, Conservative trials).
   - Click **Edit Clinical Data** to verify or supplement notes, then save.
7. **Evaluate Completeness**:
   - In Tab 4 (Missing Info Checker), click **Re-Evaluate Rules**.
   - Observe the live percentage meter and green checks on verified criteria.
8. **Generate Prior Authorization Draft**:
   - In Tab 5, review the compiled Prior Authorization packet.
   - Click **Download Real PDF** to receive a server-generated binary PDF document.
9. **Physician Sign-Off**:
   - In Tab 6, review the clinical accuracy prompt.
   - Click **Sign & Submit Physician Review** and **Mark Ready for Submission**.
10. **Dispatch Simulated Payer Submission**:
    - In Tab 7 (Payer Gateway), click **Submit to Payer Gateway (Simulated)**.
    - View the generated reference (e.g. `DEMO-SUB-592810`).
    - Use the **Mock Payer Adjudication Simulator** to test **Approve Request** or **Request Info**.
    - Notice the timeline updates and new notifications generated!

---

## 6. Installation & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ or v24+ recommended)
- **npm**: v9.0.0 or later

### Setup Steps

1. **Clone or Open the Repository**:
   ```bash
   cd c:\Users\SWASTHIK\Downloads\Hackspirit
   ```

2. **Install Root, Backend, and Frontend Dependencies**:
   ```bash
   npm --prefix backend install
   npm --prefix frontend install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `backend/.env`:
   ```bash
   cp .env.example backend/.env
   ```
   *(By default, `DATABASE_URL="file:./dev.db"` runs zero-config SQLite without needing an external database daemon).*

4. **Initialize Database & Seed Demonstration Data**:
   ```bash
   npm run prisma:push
   npm run prisma:seed
   ```

5. **Execute Automated Backend Tests**:
   ```bash
   npm test
   ```

6. **Start the Application**:
   - **Start Backend**:
     ```bash
     npm run dev:backend
     ```
     *(Runs on `http://localhost:5001`)*
   - **Start Frontend**:
     ```bash
     npm run dev:frontend
     ```
     *(Runs on `http://localhost:5173`)*

Open your browser at **`http://localhost:5173`**.

---

## 7. Security, Privacy & Compliance Considerations

- **Synthetic Clinical Data**: All patient names, MRNs, member IDs, and clinical notes in this prototype are synthetic. No real Protected Health Information (PHI) is processed or stored.
- **Zero Hallucination Safeguard**: The extraction engine is strictly bound to text discovered in the source medical record. If a clinical data point is absent, the system displays *"Not found in documents"* and flags it for human review.
- **Role-Based Access Control**: Strict server-side endpoint protection ensures that administrative operations (user provisioning, audit logs, payer rule configuration) are accessible solely by authenticated users with role `ADMINISTRATOR`.
- **Disclaimer**: This system assists with administrative preparation and does not replace medical judgment or professional verification. Real insurance integrations require official EDI X12 278/275 gateway configurations.

---

## 8. License
Developed for the Healthcare Hackathon 2026. Built with modern, maintainable TypeScript.
