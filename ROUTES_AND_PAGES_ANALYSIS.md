# Project Analysis: Routes, Pages, and Folder Structure

## 1. Application Overview

- Project type: React app created with `react-scripts`.
- React version: `^19.2.3`.
- Routing: `react-router-dom` v7.
- Styling: TailwindCSS and `src/index.css`.
- Main entry: `src/index.js`.
- Route configuration: `src/App.js`.

## 2. Root Routing Structure

`src/App.js` contains the full route map. The application renders inside `BrowserRouter` and uses nested `Routes`.

Top-level layout:
- `/` renders `<Layout />`
- `Layout` contains `<Navbar />` and an `<Outlet />` for nested views.

Routes under `/`:
- `/` → `Home` (`src/components/pages/Dashboard/dashboard.jsx`)
- `/general` → `General` wrapper (`src/components/pages/Genral/general.jsx`)
  - `/general/customer` → `AddNewCustomerModal` (`src/components/pages/Genral/customer.jsx`)
  - `/general/services` → `Servicemodel` (`src/components/pages/Genral/servicesdata.jsx`)
  - `/general/spare` → `Spare` (`src/components/pages/Genral/sparedata.jsx`)
  - `/general/expense` → `ExpenseData` (`src/components/pages/Genral/expensedata.jsx`)
  - `/general/employee` → `Employee` (`src/components/pages/Genral/employee.jsx`)

- `/purchase` → `<MainLayout />` wrapper
  - `/purchase` → `PurchaseHome` (`src/components/pages/Purchase/purchasehome.jsx`)
  - `/purchase/stock` → `Stock` (`src/components/pages/Purchase/purchaseitem.jsx`)
  - `/purchase/orders` → `PurchaseOrder` (`src/components/forms/purchaseorderform.jsx`)
  - `/purchase/debit` → `Debitnote` (`src/components/forms/debitnoteform.jsx`)
  - `/purchase/po-format/:poNumber` → `PurchaseOrderFormat` (`src/components/pages/Purchase/purchaseorderview.jsx`)
  - `/purchase/debitnote-view/:dnNumber` → `Debitnoteview` (`src/components/pages/Purchase/debitnoteview.jsx`)
  - `/purchase/supplier` → `SupplierAdvance` (`src/components/forms/supplieradvance.jsx`)
  - `/purchase/supplier-ledger` → `SupplierModel` (`src/components/ui/supplierreport.jsx`)
  - `/purchase/tax` → `TaxPurchaseEntry` (`src/components/forms/taxpurchaseentry.jsx`)
  - `/purchase/tax-report` → `Purchaseentryreport` (`src/components/ui/purchasereport.jsx`)
  - `/purchase/billwise` → `BillwisePayment` (`src/components/forms/bilwisepayment.jsx`)
  - `/purchase/bill-format` → `Billwiseformat` (`src/components/pages/Purchase/bilwisepaymentformat.jsx`)

- `/sales` → `<MainLayout />` wrapper
  - `/sales` → `SalesModule` (`src/components/pages/Sales/salesmodule.jsx`)
  - `/sales/quotation` → `Quotation` (`src/components/forms/quotationform.jsx`)
  - `/sales/Qt-format/:QtNumber` → `Quotationview` (`src/components/pages/Sales/quotationoverview.jsx`)
  - `/sales/performance-invoice` → `PerformanceInvoice` (`src/components/forms/performainvoiceform.jsx`)
  - `/sales/sales-invoice` → `SalesInvoiceForm` (`src/components/forms/salesinvoiceform.jsx`)
  - `/sales/sales-dc` → `SalesDCEntry` (`src/components/forms/salesdcentryform.jsx`)

- `/services` → `<MainLayout />` wrapper
  - `/services` → `ServiceModule` (`src/components/pages/Services/ServiceModule.jsx`)
  - `/services/inward-entry` → `InwardEntry` (`src/components/forms/inwardEntryform.jsx`)
  - `/services/service-dc` → `ServicedcEntry` (`src/components/forms/dcEntryform.jsx`)

- `/production` → `ProductionStock` (`src/components/pages/Production/productionstock.jsx`)
- `/reports` → `Reports` (`src/components/pages/Reports/reports.jsx`)

## 3. Layout Components

- `src/components/layout/layout.jsx`
  - Wraps the app with a header/navbar and `Outlet`.
  - Uses `Navbar` from `src/components/layout/navbar.jsx`.

- `src/components/layout/mainlayout.jsx`
  - A simple page wrapper with padded content and `Outlet`.
  - Used by nested `/purchase`, `/sales`, and `/services` routes.

## 4. Primary Page Folders

### Dashboard
- `src/components/pages/Dashboard/dashboard.jsx`

### General
- `src/components/pages/Genral/general.jsx`
- `src/components/pages/Genral/customer.jsx`
- `src/components/pages/Genral/servicesdata.jsx`
- `src/components/pages/Genral/sparedata.jsx`
- `src/components/pages/Genral/expensedata.jsx`
- `src/components/pages/Genral/employee.jsx`
- `src/components/pages/Genral/supplier.jsx`

### Purchase
- `src/components/pages/Purchase/purchasehome.jsx`
- `src/components/pages/Purchase/purchaseitem.jsx`
- `src/components/pages/Purchase/purchaseorderview.jsx`
- `src/components/pages/Purchase/debitnoteview.jsx`
- `src/components/pages/Purchase/bilwisepaymentformat.jsx`

### Sales
- `src/components/pages/Sales/salesmodule.jsx`
- `src/components/pages/Sales/quotationoverview.jsx`

### Services
- `src/components/pages/Services/ServiceModule.jsx`

### Production
- `src/components/pages/Production/productionstock.jsx`

### Reports
- `src/components/pages/Reports/reports.jsx`

## 5. Form Components

Forms are mostly separate from page route outputs and are imported directly in `src/App.js`.

- `src/components/forms/purchaseorderform.jsx`
- `src/components/forms/debitnoteform.jsx`
- `src/components/forms/supplieradvance.jsx`
- `src/components/forms/taxpurchaseentry.jsx`
- `src/components/forms/bilwisepayment.jsx`
- `src/components/forms/quotationform.jsx`
- `src/components/forms/performainvoiceform.jsx`
- `src/components/forms/salesinvoiceform.jsx`
- `src/components/forms/salesdcentryform.jsx`
- `src/components/forms/inwardEntryform.jsx`
- `src/components/forms/dcEntryform.jsx`

## 6. UI / Report Components

- `src/components/ui/supplierreport.jsx`
- `src/components/ui/purchasereport.jsx`
- `src/components/ui/saleswindowModal.jsx`
- `src/components/ui/WindowModal.jsx`
- `src/components/ui/nottifications.jsx`

## 7. Recommended Edit Points

### Route changes
- Edit `src/App.js` for any path additions, nested route changes, or new route wrappers.
- Add new pages under `src/components/pages/...` and import them into `App.js`.

### Layout changes
- `src/components/layout/layout.jsx` controls the app shell and global header.
- `src/components/layout/mainlayout.jsx` controls nested section page spacing.

### Shared UI changes
- `src/components/layout/navbar.jsx` likely controls navigation links.
- `src/components/ui/*.jsx` contains shared widgets and reports used by pages.

## 8. Notes

- The app automatically sets `adminPassword` in `localStorage` if missing.
- `react-router-dom` v7 `Navigate` is used for `/general` default redirect to `/general/customer`.
- The `MainLayout` wrapper is used in the purchase, sales, and services sections.

## 9. How to use this file

- Use this file as a map for where routes are wired and where pages live.
- To add a new feature, create a new page component, add it to the proper folder, then register its route in `src/App.js`.
- For styling or layout adjustments, edit the layout component(s) or the page component CSS classes.
