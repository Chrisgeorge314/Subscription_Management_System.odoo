# Brightloop — Unified Subscription Management System
> Built for the **ODOO Kochi Hackathon**

Brightloop is a production-grade, full-lifecycle Subscription Management System for SaaS companies, built with modern design principles (Linear, Stripe, Raycast aesthetic) and a robust relational architecture.

---

## 🚀 Live Demo Credentials

| Role | Email | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@brightloop.io` | `Admin@1234` | Full access to all modules, staff creation, tax & discount rules, billing engine |
| **Staff** | `staff@brightloop.io` | `Staff@1234` | Operations access: customer directory, quotations, subscriptions, invoices, payments |
| **Customer** | `customer@technova.com` | `Customer@1234` | Self-service customer portal (Technova Pvt Ltd): view subscriptions, invoices, pay via UPI/Card |

*Tip: You can also use the **1-Click Quick Login** buttons on the Login page or the persona switcher in the bottom-left profile avatar to instantly toggle between roles during live demonstrations.*

---

## 🎨 Visual Identity & Design Direction

The UI matches the official hackathon design specifications:
* **Background**: Warm off-white (`#F8F9FA`)
* **Surfaces**: Pristine white (`#FFFFFF`) with subtle slate borders
* **Primary**: Deep navy (`#18243A`)
* **Accents**: Teal (`#14B8A6`) and Sky Blue (`#0EA5E9`)
* **Typography**: Inter / System-UI
* **Icons**: Lucide React
* **Charts**: Recharts dual-axis line/area charts and status donut

---

## 📦 Architecture & Technology Stack

* **Frontend**:
  * React 18, TypeScript, Vite
  * Tailwind CSS for modern enterprise styling
  * Recharts for interactive analytics
  * Lucide React for consistent icon set
* **Backend**:
  * Node.js, Express.js REST API
  * Role-Based Access Control (RBAC) middleware
  * `node-cron` scheduled automated recurring billing
* **Database**:
  * SQLite via Prisma ORM (zero-config, full ACID relational transactions)
  * Seamless PostgreSQL compatibility (simply change provider in `schema.prisma`)
  * Realistic seed dataset with 16 Indian business entities and historical transactions

---

## 🔑 Key Features & Modules

### 1. Executive Dashboard (Pixel-Accurate)
* **KPI Metrics**: Total Revenue (₹24,80,320), MRR (₹8,42,000), Active Subscriptions (1,247), Outstanding Payments (₹3,18,400)
* **Revenue & Subscription Growth**: Dual line/area chart with monthly tooltip
* **Subscription Status**: Interactive donut breakdown (Active, Paused, Closed, Draft, Expired)
* **Summary Tables**: Recent Subscriptions, Recent Transactions, Upcoming Renewals, and Top Customers

### 2. Quotation to Subscription Conversion (1-Click Workflow)
1. Select Customer
2. Pick Product & Variants (e.g. ODOO Brand Tier +₹560 automatically increases unit price)
3. Set validity period & custom discount
4. Preview quotation with GST breakdown
5. Click **"Convert to Active Subscription →"**:
   * Transitions quotation to `CONVERTED`
   * Creates an active `Subscription` record with calculated billing period
   * Automatically generates the initial recurring `Invoice`

### 3. Automated Recurring Billing Engine
* **Automated Cron**: Executes every night at `00:00`
* **On-Demand Demo Trigger**: Click **`⚡ Run Billing`** in the top navigation bar
* **Idempotency Guarantee**: Prevents duplicate invoices for the same subscription billing period
* **Auto-Closure**: Automatically closes expired subscriptions where `autoCloseOnEnd` is configured

### 4. Payments & Invoices Reconciliation
* Multi-channel recording: UPI, Bank Transfer (NEFT/RTGS), Credit Card, Cash
* Validates that payment amount **cannot exceed** outstanding balance
* Automatically transitions invoice status from `SENT` / `PARTIALLY_PAID` to `PAID` when fully settled

### 5. Multi-Variant Product Catalog
* Define product categories: Service (SaaS), Digital Addons, Physical Terminals
* Add dynamic variants with price modifiers (e.g., ODOO Brand +₹560)

### 6. Tax (GST) & Discount Rules Engine
* GST 18% standard, GST 12%, and SEZ/Zero-rated export tax rules
* Promotional codes (percentage % or flat ₹) with usage limits, minimum spend, and expiry rules

### 7. Customer Self-Service Portal
* Isolated customer dashboard
* View active contracts, next renewal date, and invoice ledger
* Request pause, resume, or renewal (strictly respects plan permissions)
* Direct **"Pay Now"** modal with UPI simulation

### 8. Analytics & CSV Export
* Financial metrics (Total Revenue, MRR, ARR, Collection Rate)
* 1-Click CSV export for:
  * `brightloop_subscriptions.csv`
  * `brightloop_invoices.csv`
  * `brightloop_payments.csv`

---

## 🛠️ Quick Start Instructions

### Prerequisites
* Node.js v18+ (tested on Node v24)
* npm v9+

### 1. Start Backend Server
```bash
cd server
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
# Running on http://localhost:5000
```

### 2. Start Frontend Client
```bash
cd client
npm install
npm run dev
# Running on http://localhost:3000
```

Open `http://localhost:3000` in your web browser.
