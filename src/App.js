import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { KeyboardNavProvider } from "./context/KeyboardNavProvider";
import Layout from "./components/layout/layout";
import Home from "./components/pages/Dashboard/dashboard";
import General from "./components/pages/Genral/general";
import PurchaseHome from "./components/pages/Purchase/purchasehome";
import { Toaster } from "react-hot-toast";
import ProductionStock from "./components/pages/Production/productionstock";
import SalesModule from "./components/pages/Sales/salesmodule";
import Reports from "./components/pages/Reports/reports";
import PendingReport from "./components/pages/Reports/pendingreport";
import AddNewCustomerModal from "./components/pages/Genral/customer";
import Spare from "./components/pages/Genral/sparedata";
import Employee from "./components/pages/Genral/employee";
import ExpenseData from "./components/pages/Genral/expensedata";
import Stock from "./components/pages/Purchase/purchaseitem";
import PurchaseOrder from "./components/forms/purchaseorderform";
import PurchaseOrderFormat from "./components/pages/Purchase/purchaseorderview";
import Debitnote from "./components/forms/debitnoteform";
import Debitnoteview from "./components/pages/Purchase/debitnoteview";
import SupplierAdvance from "./components/forms/supplieradvance";
import SupplierModel from "./components/ui/supplierreport";
import TaxPurchaseEntry from "./components/forms/taxpurchaseentry";
import BillwisePayment from "./components/forms/bilwisepayment";
import Billwiseformat from "./components/pages/Purchase/bilwisepaymentformat";
import Servicemodel from "./components/pages/Genral/servicesdata";
import MonthlyReport from "./components/ui/monthlystatement";
import ExpenseReport from "./components/pages/Genral/reports";
import ContactPage from "./components/pages/Contact/contact";



//  Layouts
import MainLayout from "./components/layout/mainlayout";


// Production Modules

import PCBStock from "./components/forms/pcbstok";
import ScrapPcb from "./components/forms/scrap";
import Sparestock from "./components/forms/spareusage";
import StandbyPCB from "./components/forms/standbypcb";



//  Sales Modules
import Quotation from "./components/forms/quotationform";
import Quotationview from "./components/pages/Sales/quotationoverview";
import PerformanceInvoice from "./components/forms/performainvoiceform";
import SalesInvoiceForm from "./components/forms/salesinvoiceform";
import SalesDCEntry from "./components/forms/salesdcentryform";
import ReceiptEntry from "./components/forms/receiptentry";
import ReceiptAdvance from "./components/forms/receiptAdvance";
import PendingForm from "./components/forms/pending";
import CustomerLedger from "./components/ui/customerledger";
import SalesReport from "./components/ui/salesreport";
import PendingBillsReport from "./components/ui/pendingbillsreport";
import ReceiptReport from "./components/ui/receiptreport";
import SalesViewReport from "./components/ui/salesviewreport";
import PurchaseViewReport from "./components/ui/purchaseviewreport";
import CreditNote from "./components/forms/creditnoteform";
import PerformanceInvoiceForm2 from "./components/forms/performainvoiceform2";
import PerformanceInvoiceView2 from "./components/pages/Sales/performanceinvoiceview2";
import PerformanceInvoiceReport2 from "./components/pages/Sales/performanceinvoicereport2";

// Service
import ServiceModule from "./components/pages/Services/ServiceModule";
import InwardEntry from "./components/forms/inwardEntryform";
import ServicedcEntry from "./components/forms/dcEntryform";
import ServiceInvoice from "./components/forms/serviceinvoice";
import ServiceDCView from "./components/pages/Services/dcFormat";
import InvoiceView from "./components/pages/Sales/invoiceview";

// Job
import JobDcEntryForm from "./components/forms/jobDcEntryForm";
import JobReturnDcEntryForm from "./components/forms/jobReturnDcEntryForm";
import JobDetailsReport from "./components/pages/Reports/jobDetailsReport";

// Standby
import StandbyDcEntryForm from "./components/forms/standbyDcEntryForm";
import StandbyReturnDcEntryForm from "./components/forms/standbyReturnDcEntryForm";
import StandbyDetailsReport from "./components/pages/Reports/standbyDetailsReport";




function App() {

  if (!localStorage.getItem("adminPassword")) {
    localStorage.setItem("adminPassword", "Ashwitha@123");
  }
  return (
    <BrowserRouter>
      <KeyboardNavProvider>
      <Toaster position="top-right" reverseOrder={false} />

      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="general" element={<General />}>
            <Route index element={<Navigate to="customer" replace />} />
            <Route path="customer" element={<AddNewCustomerModal />} />
            <Route path="services" element={<Servicemodel />} />
            <Route path="spare" element={<Spare />} />
            <Route path="expense" element={<ExpenseData />} />
            <Route path="employee" element={<Employee />} />
            <Route path="expense-report" element={<ExpenseReport />} />
          </Route>

          {/* purchase module */}

          <Route path="purchase" element={<MainLayout />}>
            <Route index element={<PurchaseHome />} />
            <Route path="stock" element={<Stock />} />
            <Route path="orders" element={<PurchaseOrder />} />
            <Route path="debit" element={<Debitnote />} />
            <Route path="po-format/:poNumber" element={<PurchaseOrderFormat />} />
            <Route path="debitnote-view/:dnNumber" element={<Debitnoteview />} />
            <Route path="supplier" element={<SupplierAdvance />} />
            <Route path="supplier-ledger" element={<SupplierModel />} />
            <Route path="tax" element={<TaxPurchaseEntry />} />
            <Route path="billwise" element={<BillwisePayment />} />
            <Route path="bill-format" element={<Billwiseformat />} />
            <Route path="monthly-statement" element={<MonthlyReport />} />
            <Route path="purchase-view-report" element={<PurchaseViewReport />} />
          </Route>

  {/* Production Modules */}

          <Route path="production" element={<MainLayout />}>
            <Route index element={<ProductionStock />} />
            <Route path="pcb-stock" element={<PCBStock />} />
            <Route path="scrap-pcb" element={<ScrapPcb />} />
            <Route path="spare-stock" element={<Sparestock />} />
            <Route path="standby-pcb" element={<StandbyPCB />} />
          </Route>



          {/* sales modules */}

          <Route path="sales" element={<MainLayout />}>
            <Route index element={<SalesModule />} />
            <Route path="quotation" element={<Quotation />} />
            <Route path="Qt-format/:QtNumber" element={<Quotationview />} />
            <Route path="performance-invoice" element={<PerformanceInvoice />} />
            <Route path="sales-invoice" element={<SalesInvoiceForm />} />
            <Route path="sales-dc" element={<SalesDCEntry />} />
            <Route path="invoice-format/:invoiceNo" element={<InvoiceView />} />
            <Route path="receipt" element={<ReceiptEntry />} />
            <Route path="receipt-advance" element={<ReceiptAdvance />} />
            <Route path="customer-Ledger" element={<CustomerLedger />} />
            <Route path="sales-report" element={<SalesReport />} />
            <Route path="pending-bills" element={<PendingBillsReport />} />
            <Route path="Reciept-Format" element={<ReceiptReport />} />
            <Route path="credit-note" element={<CreditNote />} />
            <Route path="credit-note-view/:cnNumber" element={<creditnoteview />} />
            <Route path="sales-view-report" element={<SalesViewReport />} />
            
            <Route path="performance-invoice-2" element={<PerformanceInvoiceForm2 />} />
            <Route path="pi2-format/:invoiceNo" element={<PerformanceInvoiceView2 />} />
            <Route path="pi2-report" element={<PerformanceInvoiceReport2 />} />
          </Route>

          {/* Service Module */}

          <Route path="services" element={<MainLayout />}>
            <Route index element={<ServiceModule />} />
            <Route path="inward-entry" element={<InwardEntry />} />
            <Route path="service-dc" element={<ServicedcEntry />} />
            <Route path="service-invoice" element={<ServiceInvoice />} />
            <Route path="dc-format" element={<ServiceDCView />} />
            <Route path="pending" element={<PendingForm />} />
          </Route>

          {/* Job Module */}

          <Route path="job" element={<MainLayout />}>
            <Route path="job-dc" element={<JobDcEntryForm />} />
            <Route path="job-return-dc" element={<JobReturnDcEntryForm />} />
            <Route path="job-details" element={<JobDetailsReport />} />
          </Route>

          {/* Standby Module */}

          <Route path="standby" element={<MainLayout />}>
            <Route path="standby-dc" element={<StandbyDcEntryForm />} />
            <Route path="standby-return-dc" element={<StandbyReturnDcEntryForm />} />
            <Route path="standby-details" element={<StandbyDetailsReport />} />
          </Route>


          <Route path="production" element={<ProductionStock />} />
          <Route path="reports" element={<Reports />} />
          <Route path="pending" element={<PendingReport />} />
          <Route path="contact" element={<ContactPage />} />
        </Route>

      </Routes>
      </KeyboardNavProvider>
    </BrowserRouter>
  );
}


export default App;
