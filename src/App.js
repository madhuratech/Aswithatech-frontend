import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { KeyboardNavProvider } from "./context/KeyboardNavProvider";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/auth/PrivateRoute";
import LoginPage from "./components/auth/LoginPage";
import { initAuthFetch } from "./config/api";
import Layout from "./components/layout/layout";
import DesktopWindowModal from "./components/ui/DesktopWindowModal";
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
import Setting from "./components/pages/Genral/setting";
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
import ExpenseLedger from "./components/ui/expenseledger";
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
import Creditnoteview from "./components/pages/Sales/creditnote";
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

// Patch global fetch to auto-inject JWT once
initAuthFetch();

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <KeyboardNavProvider>
          <Toaster position="top-right" reverseOrder={false} />
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Home />} />
              <Route path="general" element={<General />}>
                <Route index element={<Navigate to="customer" replace />} />
                <Route path="customer" element={<AddNewCustomerModal />} />
                <Route path="services" element={<Servicemodel />} />
                <Route path="spare" element={<Spare />} />
                <Route path="expense" element={<ExpenseData />} />
                <Route path="employee" element={<Employee />} />
                <Route path="expense-report" element={<ExpenseLedger />} />
                <Route path="setting" element={<DesktopWindowModal title="System Settings"><Setting /></DesktopWindowModal>} />
              </Route>

              <Route path="purchase" element={<MainLayout />}>
                <Route path="" element={<PurchaseHome />}>
                  <Route path="stock" element={<DesktopWindowModal title="Purchase Item"><Stock /></DesktopWindowModal>} />
                  <Route path="orders" element={<DesktopWindowModal title="Purchase Order"><PurchaseOrder /></DesktopWindowModal>} />
                  <Route path="debit" element={<DesktopWindowModal title="Debit Note"><Debitnote /></DesktopWindowModal>} />
                  <Route path="supplier" element={<DesktopWindowModal title="Supplier Advance"><SupplierAdvance /></DesktopWindowModal>} />
                  <Route path="tax" element={<DesktopWindowModal title="Tax Purchase Entry"><TaxPurchaseEntry /></DesktopWindowModal>} />
                  <Route path="billwise" element={<DesktopWindowModal title="Billwise Payment"><BillwisePayment /></DesktopWindowModal>} />
                </Route>
                <Route path="po-format/:poNumber" element={<PurchaseOrderFormat />} />
                <Route path="debitnote-view/:dnNumber" element={<Debitnoteview />} />
                <Route path="supplier-ledger" element={<SupplierModel />} />
                <Route path="bill-format" element={<Billwiseformat />} />
                <Route path="monthly-statement" element={<MonthlyReport />} />
                <Route path="purchase-view-report" element={<PurchaseViewReport />} />
              </Route>

              <Route path="production" element={<MainLayout />}>
                <Route path="" element={<ProductionStock />}>
                  <Route path="pcb-stock" element={<DesktopWindowModal title="PCB Stock Entry"><PCBStock /></DesktopWindowModal>} />
                  <Route path="scrap-pcb" element={<DesktopWindowModal title="Scrap PCB Entry"><ScrapPcb /></DesktopWindowModal>} />
                  <Route path="spare-stock" element={<DesktopWindowModal title="Spare Stock Entry"><Sparestock /></DesktopWindowModal>} />
                  <Route path="standby-pcb" element={<DesktopWindowModal title="Standby PCB Entry"><StandbyPCB /></DesktopWindowModal>} />
                </Route>
              </Route>

              <Route path="sales" element={<MainLayout />}>
                <Route path="" element={<SalesModule />}>
                  <Route path="quotation" element={<DesktopWindowModal title="Quotation Entry"><Quotation /></DesktopWindowModal>} />
                  <Route path="performance-invoice" element={<DesktopWindowModal title="Proforma Invoice Entry"><PerformanceInvoice /></DesktopWindowModal>} />
                  <Route path="sales-invoice" element={<DesktopWindowModal title="Sales Invoice Entry"><SalesInvoiceForm /></DesktopWindowModal>} />
                  <Route path="sales-dc" element={<DesktopWindowModal title="Sales Delivery Challan Entry"><SalesDCEntry /></DesktopWindowModal>} />
                  <Route path="receipt" element={<DesktopWindowModal title="Receipt Entry"><ReceiptEntry /></DesktopWindowModal>} />
                  <Route path="receipt-advance" element={<DesktopWindowModal title="Receipt Advance Entry"><ReceiptAdvance /></DesktopWindowModal>} />
                  <Route path="credit-note" element={<DesktopWindowModal title="Credit Note Entry"><CreditNote /></DesktopWindowModal>} />
                  <Route path="performance-invoice-2" element={<DesktopWindowModal title="Proforma Invoice 2 Entry"><PerformanceInvoiceForm2 /></DesktopWindowModal>} />
                </Route>
                <Route path="Qt-format/:QtNumber" element={<Quotationview />} />
                <Route path="invoice-format/:invoiceNo" element={<InvoiceView />} />
                <Route path="customer-Ledger" element={<CustomerLedger />} />
                <Route path="sales-report" element={<SalesReport />} />
                <Route path="pending-bills" element={<PendingBillsReport />} />
                <Route path="Reciept-Format" element={<ReceiptReport />} />
                <Route path="credit-note-view/:cnNumber" element={<Creditnoteview />} />
                <Route path="sales-view-report" element={<SalesViewReport />} />
                <Route path="pi2-format/:invoiceNo" element={<PerformanceInvoiceView2 />} />
                <Route path="pi2-report" element={<PerformanceInvoiceReport2 />} />
              </Route>

              <Route path="services" element={<MainLayout />}>
                <Route path="" element={<ServiceModule />}>
                  <Route path="inward-entry" element={<DesktopWindowModal title="Inward Entry"><InwardEntry /></DesktopWindowModal>} />
                  <Route path="service-dc" element={<DesktopWindowModal title="Service Delivery Challan Entry"><ServicedcEntry /></DesktopWindowModal>} />
                  <Route path="service-invoice" element={<DesktopWindowModal title="Service Invoice Entry"><ServiceInvoice /></DesktopWindowModal>} />
                  <Route path="pending" element={<DesktopWindowModal title="Pending Entry"><PendingForm /></DesktopWindowModal>} />
                </Route>
                <Route path="dc-format" element={<ServiceDCView />} />
              </Route>

              <Route path="job" element={<MainLayout />}>
                <Route path="job-dc" element={<DesktopWindowModal title="Job Delivery Challan Entry"><JobDcEntryForm /></DesktopWindowModal>} />
                <Route path="job-return-dc" element={<DesktopWindowModal title="Job Return Delivery Challan Entry"><JobReturnDcEntryForm /></DesktopWindowModal>} />
                <Route path="job-details" element={<JobDetailsReport />} />
              </Route>

              <Route path="standby" element={<MainLayout />}>
                <Route path="standby-dc" element={<DesktopWindowModal title="Standby Delivery Challan Entry"><StandbyDcEntryForm /></DesktopWindowModal>} />
                <Route path="standby-return-dc" element={<DesktopWindowModal title="Standby Return Delivery Challan Entry"><StandbyReturnDcEntryForm /></DesktopWindowModal>} />
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
    </AuthProvider>
  );
}

export default App;
