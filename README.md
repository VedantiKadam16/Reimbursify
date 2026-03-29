# 💰 Reimbursify — Smart Reimbursement Hub

> An AI-powered enterprise expense reimbursement platform with OCR receipt scanning, real-time currency conversion, fraud detection, and multi-level approval workflows.

---

## 📋 Table of Contents

- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
- [Usage & Workflows](#usage--workflows)
- [Role-Based Access](#role-based-access)
- [AI & Automation](#ai--automation)
- [Screenshots](#screenshots)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)
- [License](#license)

---

## 📖 About the Project

**Reimbursify** is a full-featured expense reimbursement management system designed for enterprises. It automates the entire lifecycle of expense submissions — from receipt scanning to multi-level approvals — with built-in AI capabilities for fraud detection and OCR-based data extraction.

The platform supports **role-based access control** (Admin, Manager, Employee), **multi-currency expense handling** with real-time exchange rates, and **configurable approval workflows** including sequential and parallel approval chains.

---

## ✨ Key Features

### 🧾 Expense Management
- **Submit Expenses** — Employees can create and submit expense claims with full details (description, category, amount, date, paid-by, remarks).
- **Draft & Submit Workflow** — Save expenses as drafts before submitting for approval.
- **Expense History** — View all past expenses with status tracking (Draft → Pending → Approved/Rejected).
- **Category-Based Classification** — Categorize expenses under Food & Dining, Travel, Accommodation, Office Supplies, Transportation, Communication, and Miscellaneous.

### 🤖 AI-Powered OCR (Tesseract.js)
- **Receipt Scanning** — Upload a receipt image and the system automatically extracts:
  - **Amount** — Smart extraction using keyword matching (Total, Net Pay, Amount, etc.) with fallback to largest numeric value.
  - **Date** — Automatic date parsing from receipt text.
  - **Vendor Name** — Extracted from the first line of the receipt.
  - **Category** — Auto-classified based on receipt content keywords.
- **Real-Time Processing** — Powered by **Tesseract.js v7** for client-side OCR (no server required).

### 💱 Multi-Currency Support
- **160+ Currencies** — Fetched dynamically from the REST Countries API.
- **Real-Time Conversion** — When an employee submits in a foreign currency, the amount is automatically converted to the company's base currency using live exchange rates from **ExchangeRate API**.
- **Flexible Submission** — Employees submit in the currency they spent; managers see the converted amount.

### 🔍 Fraud Detection System
- **Duplicate Receipt Detection** — Flags expenses where the same amount and date already exist for the user.
- **Anomaly Detection** — Flags expenses exceeding **3× the user's average** spending as suspicious.
- **Visual Alerts** — Suspicious expenses are marked with ⚠️ warning icons and flagged on the dashboard.

### ✅ Multi-Level Approval Workflow
- **Configurable Approval Rules** — Admin can define custom approval chains per employee.
- **Sequential Approvals** — Approvers are notified in order; the next approver is unlocked only after the previous one approves.
- **Parallel Approvals** — All approvers are notified simultaneously.
- **Manager Auto-Assignment** — If no custom rule exists, expenses route to the employee's direct manager.
- **Approval History Log** — Full audit trail showing who approved/rejected and when.

### 📊 Analytics Dashboard
- **Summary Cards** — Total Expenses, Pending, Approved, Rejected counts at a glance.
- **Category Distribution Chart** — Bar chart showing spending by category (powered by **Recharts**).
- **Status Overview Pie Chart** — Donut chart visualizing expense status distribution.
- **Recent Expenses Table** — Quick view of the latest 5 expense submissions.
- **Role-Scoped Data** — Admins see all data; Managers see their team's data; Employees see only their own.

### 👥 User & Role Management
- **Role-Based Access Control** — Three roles with distinct permissions:
  - **Admin** — Full access to all features including user management and approval rules.
  - **Manager** — Can approve/reject team expenses; view team analytics.
  - **Employee** — Can submit expenses and view personal history.
- **User CRUD** — Admins can add, edit, and delete users.
- **Company Setup** — Register with company details including country and base currency.

---

## 🛠 Tech Stack

| Layer           | Technology                                                                 |
|-----------------|---------------------------------------------------------------------------|
| **Framework**   | React 18 + TypeScript                                                     |
| **Build Tool**  | Vite 5                                                                    |
| **Styling**     | Tailwind CSS 3 + shadcn/ui (Radix UI primitives)                          |
| **State**       | React Context API + LocalStorage persistence                              |
| **Routing**     | React Router DOM v6                                                       |
| **Charts**      | Recharts                                                                  |
| **OCR**         | Tesseract.js v7 (client-side)                                             |
| **Forms**       | React Hook Form + Zod validation                                         |
| **HTTP**        | Fetch API (REST Countries API, ExchangeRate API)                          |
| **Testing**     | Vitest + React Testing Library + Playwright                               |
| **Notifications** | Sonner (toast notifications)                                           |

---

## 🏗 Project Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
├─────────────────────────────────────────────────┤
│  React SPA (Vite + TypeScript)                   │
│  ┌───────────┐  ┌───────────┐  ┌──────────────┐ │
│  │  Login     │  │ Dashboard │  │  Expenses    │ │
│  │  Page      │  │  Page     │  │  Page + OCR  │ │
│  └───────────┘  └───────────┘  └──────────────┘ │
│  ┌───────────┐  ┌───────────┐  ┌──────────────┐ │
│  │ Approvals │  │  Users    │  │  Approval    │ │
│  │  Page      │  │  Page     │  │  Rules Page  │ │
│  └───────────┘  └───────────┘  └──────────────┘ │
├─────────────────────────────────────────────────┤
│  AppContext (Global State + LocalStorage)         │
├─────────────────────────────────────────────────┤
│  External APIs:                                   │
│  • REST Countries API (currencies)                │
│  • ExchangeRate API (live conversion rates)       │
│  • Tesseract.js (client-side OCR engine)          │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x (or **bun**)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/VedantiKadam16/Reimbursify.git
cd Reimbursify/smart-reimbursement-hub-main

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be available at **http://localhost:5173** (Vite default port).

### Build for Production

```bash
npm run build
npm run preview
```

### Run Tests

```bash
# Unit tests (Vitest)
npm run test

# Watch mode
npm run test:watch
```

---

## 🔄 Usage & Workflows

### 1. Onboarding Flow

```
Sign Up → Enter Name, Email, Role, Country, Currency → Company Created → Dashboard
```

- A new **Company** is auto-created with the selected country/currency.
- The first user becomes the **Admin**.

### 2. Expense Submission Flow

```
Employee → New Expense → (Optional: Upload Receipt for OCR) → Fill Details → Submit
```

1. Navigate to **Expenses** page.
2. Click **"New"** to open the expense form.
3. Optionally click **"Attach Receipt"** to upload a receipt image for OCR auto-fill.
4. Select the **currency** you spent in (from 160+ options).
5. Fill in remaining details and click **Submit**.
6. The system:
   - Converts the amount to the company's base currency via live exchange rates.
   - Runs fraud detection (duplicate check + anomaly detection).
   - Routes the expense through the configured approval workflow.

### 3. Approval Flow

```
Expense Submitted → Pending (Manager/Approvers notified) → Approved / Rejected
```

- **Managers** and **Admins** can view pending expenses on the **Approvals** page.
- Each approval action is logged with the approver's name, decision, and timestamp.
- Sequential approvals unlock the next approver only after the current one approves.

### 4. Admin Configuration

```
Admin → Approval Rules → Create Rule → Assign Approvers → Set Sequence/Parallel
```

- Define custom approval chains per employee.
- Toggle between sequential and parallel approval modes.
- Set minimum approval percentage thresholds.

---

## 🔐 Role-Based Access

| Feature               | Employee | Manager | Admin |
|-----------------------|----------|---------|-------|
| Submit Expenses        | ✅       | ✅      | ✅    |
| View Own Expenses      | ✅       | ✅      | ✅    |
| View Team Expenses     | ❌       | ✅      | ✅    |
| View All Expenses      | ❌       | ❌      | ✅    |
| Approve/Reject         | ❌       | ✅      | ✅    |
| Manage Users           | ❌       | ❌      | ✅    |
| Configure Approval Rules | ❌    | ❌      | ✅    |
| Dashboard Analytics    | Own only | Team    | All   |

---

## 🤖 AI & Automation

### OCR Receipt Scanning (Tesseract.js)

The system uses **Tesseract.js v7** for entirely **client-side** OCR processing — no server or API key required.

**Extraction Pipeline:**
1. **Upload** — Employee uploads a receipt photo (camera or file).
2. **Process** — Tesseract.js processes the image using the English language model.
3. **Extract** — Smart regex-based extraction:
   - Looks for keyword-amount patterns (`Total`, `Amount`, `Net Pay`, `$`, `€`, `£`, `₹`).
   - Falls back to the largest numeric value found in the text.
   - Parses dates in common formats (`YYYY-MM-DD`, `MM/DD/YYYY`).
   - Identifies vendor from the first line of recognized text.
4. **Auto-Fill** — Populates the expense form with extracted data.

### Fraud Detection Engine

| Check                  | Logic                                                    | Flag          |
|------------------------|----------------------------------------------------------|---------------|
| Duplicate Receipt      | Same amount + same date for the same user                | ⚠️ Suspicious |
| Spending Anomaly       | Amount > 3× user's historical average                    | ⚠️ Suspicious |

### Real-Time Currency Conversion

- **Source API**: `https://api.exchangerate-api.com/v4/latest/{CURRENCY}`
- Triggered automatically when the expense currency ≠ company base currency.
- Graceful fallback to 1:1 conversion if the API is unreachable.

---

## 📂 Folder Structure

```
smart-reimbursement-hub-main/
├── public/                     # Static assets
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui component library
│   │   ├── AppLayout.tsx       # Main layout with sidebar navigation
│   │   └── NavLink.tsx         # Navigation link component
│   ├── context/
│   │   └── AppContext.tsx      # Global state management (React Context)
│   ├── data/
│   │   └── mockData.ts        # Initial seed data
│   ├── hooks/
│   │   └── use-toast.ts       # Toast notification hook
│   ├── lib/
│   │   └── utils.ts           # Utility functions (cn, etc.)
│   ├── pages/
│   │   ├── LoginPage.tsx       # Authentication (Login + Signup)
│   │   ├── DashboardPage.tsx   # Analytics dashboard with charts
│   │   ├── ExpensesPage.tsx    # Expense CRUD + OCR + Currency
│   │   ├── ApprovalsPage.tsx   # Multi-level approval management
│   │   ├── UsersPage.tsx       # User management (Admin only)
│   │   ├── ApprovalRulesPage.tsx # Approval workflow configuration
│   │   ├── Index.tsx           # Root redirect
│   │   └── NotFound.tsx        # 404 page
│   ├── test/                   # Test files
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── App.tsx                 # Root component with routing
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles + design tokens
├── index.html                  # HTML entry point
├── package.json               # Dependencies & scripts
├── tailwind.config.ts         # Tailwind CSS configuration
├── vite.config.ts             # Vite build configuration
├── tsconfig.json              # TypeScript configuration
└── vitest.config.ts           # Test configuration


## 📄 License

This project is developed as part of an academic project demonstration.

---

## 👩‍💻 Author

**Vedanti Kadam** — [GitHub](https://github.com/VedantiKadam16)

---

> Built with ❤️ using React, TypeScript, and AI-powered automation.
