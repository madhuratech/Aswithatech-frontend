import { BrowserRouter, Routes, Route,Navigate } from "react-router-dom";
import Layout from "./components/layout/layout";
import Home from "./components/pages/Dashboard/dashboard";
import General from "./components/pages/Genral/general";
import PurchaseHome from "./components/pages/Purchase/purchasehome";
import {Toaster} from "react-hot-toast";
import ProductionStock from "./components/pages/Production/productionstock";
import PCBStock from "./components/pages/Production/pcbstock";
import StandbyStock from "./components/pages/Production/standbystock";
import SalesModule from "./components/pages/Sales/salesmodule";
import Reports from "./components/pages/Reports/reports";
import AddNewCustomerModal from "./components/pages/Genral/customer";
import Spare from "./components/pages/Genral/sparedata";
import Employee from "./components/pages/Genral/employee";
import ExpenseData from "./components/pages/Genral/expensedata";
import GeneralReports from "./components/pages/Genral/reports";
import Settings from "./components/pages/Genral/settings";
 import Stock from "./components/pages/Purchase/purchaseitem";
 import PurchaseOrder from "./components/forms/purchase/purchaseorderform";  
 import PurchaseOrderFormat from "./components/pages/Purchase/purchaseorderview";
import Debitnote from "./components/forms/purchase/debitnoteform";
import Debitnoteview from "./components/pages/Purchase/debitnoteview";
import Creditnote from "./components/forms/sales/creditnoteform";
 import SupplierAdvance from "./components/forms/purchase/supplieradvance";
 import SupplierModel from "./components/ui/supplierreport";
 import TaxPurchaseEntry from "./components/forms/purchase/taxpurchaseentry";
 import Purchaseentryreport from"./components/ui/purchasereport";
 import BillwisePayment from "./components/forms/purchase/bilwisepayment";
 import Billwiseformat from "./components/pages/Purchase/bilwisepaymentformat";
 import Servicemodel from "./components/pages/Genral/servicesdata";
import useKeyboardNavigation from "./hooks/useKeyboardNavigation";



//  Layouts
import MainLayout from "./components/layout/mainlayout";
 


//  Sales Modules
import Quotation from "./components/forms/sales/quotationform";
import Quotationview from "./components/pages/Sales/quotationoverview";
import PerformanceInvoice from "./components/forms/sales/performainvoiceform";
import SalesInvoiceForm from "./components/forms/sales/salesinvoiceform";
import SalesDCEntry from "./components/forms/sales/salesdcentryform";

// Service
import ServiceModule from "./components/pages/Services/ServiceModule";
import InwardEntry from "./components/forms/inwardEntryform";
import ServicedcEntry from"./components/forms/dcEntryform";
import PendingPage from "./components/pages/Services/PendingPage";
import ServiceInvoiceForm from "./components/forms/services/ServiceInvoiceForm";

// Sales — new pages
import ReceiptBillToBill from "./components/pages/Sales/ReceiptBillToBill";
import ReceiptAdvance from "./components/pages/Sales/ReceiptAdvance";

function App() {
  useKeyboardNavigation();

  if(!localStorage.getItem("adminPassword")){
  localStorage.setItem("adminPassword","Ashwitha@123");
}
  return (
    <BrowserRouter>
          <Toaster position="top-right" reverseOrder={false}/>

      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          
          <Route path="general" element={<General />}>
             <Route index element={<Navigate to="customer" replace />} />
            <Route path="customer" element={<AddNewCustomerModal/>}/>
             <Route path="services" element={<Servicemodel/>}/> 
             <Route path="spare" element={<Spare/>}/>
            <Route path="expense" element={<ExpenseData/>}/>
            <Route path="employee" element={<Employee/>}/>
            <Route path="reports" element={<GeneralReports/>}/>
            <Route path="setting" element={<Settings/>}/>
           </Route>

           {/* purchase module */}

           <Route path="purchase" element={<MainLayout />}>
           <Route index element={<PurchaseHome/>} />
           <Route path="stock" element={<Stock/>}/>
            <Route path="orders" element={<PurchaseOrder/>}/>
            <Route path="debit" element={<Debitnote/>}/>
            <Route path="po-format/:poNumber" element={<PurchaseOrderFormat/>}/>  
           <Route path="debitnote-view/:dnNumber"  element={<Debitnoteview/>}/>
           <Route path="supplier" element={<SupplierAdvance/>}/>
           <Route path="supplier-ledger" element={<SupplierModel/>}/>
          <Route path="tax" element={<TaxPurchaseEntry/>}/>
          <Route path="tax-report" element={<Purchaseentryreport/>}/>
          <Route path="billwise" element={<BillwisePayment/>}/>
           <Route path="bill-format" element={<Billwiseformat/>}/>
         </Route>

         {/* sales modules */}
         
          <Route path="sales" element={<MainLayout />}>
         <Route index element={<SalesModule/>}/>    
          <Route path="quotation" element={<Quotation/>}/>
          <Route path="Qt-format/:QtNumber" element={<Quotationview/>}/>
          <Route path="performance-invoice" element={<PerformanceInvoice/>}/>
          <Route path="sales-invoice" element={<SalesInvoiceForm/>}/>
          <Route path="sales-dc" element={<SalesDCEntry/>}/>
           <Route path="credit" element={<Creditnote/>}/>
           <Route path="receipt" element={<ReceiptBillToBill/>}/>
           <Route path="receipt-advance" element={<ReceiptAdvance/>}/>
          </Route>

         {/* Service Module */}

          <Route path="services" element={<MainLayout />}>
           <Route index element={<ServiceModule/>}/>
           <Route path="inward-entry" element={<InwardEntry/>}/>
            <Route path="service-dc" element={<ServicedcEntry/>}/>
            <Route path="pending" element={<PendingPage/>}/>
            <Route path="service-invoice" element={<ServiceInvoiceForm/>}/>
          </Route>
          

          <Route path="production" element={<ProductionStock />}/>
          <Route path="production/pcb-stock" element={<PCBStock />}/>
          <Route path="production/standby-stock" element={<StandbyStock />}/>
          <Route path="reports" element={<Reports/>}/>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}


export default App;
