import React, { useState } from "react";
import { FileText, Truck, FileCheck, Receipt, FileMinus, CreditCard,FileBarChart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SaleswindowModel from"../../ui/saleswindowModal";
import QuotationFormat from "./quotationoverview";
import InvoiceFormat from "./invoiceformat";
import SalesDCFormat from "./salesdcformat";
import CreditNoteView from "./creditnote";
const SalesCard = ({ title, subtitle, icon: Icon, bgColor, iconColor, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="flex items-center gap-5 p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
        >
            <div className={`flex items-center justify-center w-14 h-14 rounded-xl ${bgColor}`}>
                <Icon size={26} className={iconColor} />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            </div>
        </div>
    );
};

const SalesModule = () => {
    const navigate = useNavigate();
    const [openDropdown, setOpenDropdown] = React.useState(null);
    const [showModal, setShowModal] = React.useState(false);
    const [viewtype , setviewtype] = React.useState("");
    const [modalTitle, setModalTitle] = useState("");
    const [isMinimized, setIsMinimized] = useState(false);
    const [initialView] = useState("qt");
    
    

    const [filters , setFilters] = useState({
    fromDate : "",
    toDate : "",
    QtNumber : ""
    });

const openReport = async (type) => {

    setModalTitle(type);

    try {

        let latestNumber = "";

        if (type === "Quotation Format") {

            const res = await fetch(
              "http://localhost:3000/api/quotations/QT/search?q="
            );

            const data = await res.json();

            latestNumber = data[0]?.quotation_no || "";
        }

        if (type === "Invoice Format") {

            const res = await fetch(
              "http://localhost:3000/api/salesinvoices/INV/search?q="
            );

            const data = await res.json();

            latestNumber = data[0]?.invoice_no || "";
        }

        if (type === "DC Format") {

            const res = await fetch(
              "http://localhost:3000/api/salesdc/DC/search?q="
            );

            const data = await res.json();

            latestNumber = data[0]?.dc_no || "";
        }
        if (type === "Credit Note Format") {

            const res = await fetch(
              "http://localhost:3000/api/creditnotes/cn/search?q="
            );  

            const data = await res.json();

            latestNumber = data[0]?.cn_number || "";
        }

        setFilters({
            fromDate: "",
            toDate: "",
            clientName: "",
            QtNumber: latestNumber
        });

        setviewtype(type);

        setShowModal(true);

    } catch (error) {

        console.error("Error fetching latest document:", error);

    }
};

const ShowReport = (item) => {
    if(item.name === "Quotation Format" || item.name === "Invoice Format" || item.name === "DC Format" || item.name === "Credit Note Format"){
        openReport(item.name);
    }
    else{
        navigate(item.path);
    }
};
    
    



    const salesOptions = [
        {
            title: "Quotation",
            subtitle: "Create price quotes",
            icon: FileText,
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
            action: () => navigate("/sales/quotation"),
        },
        {
            title: "Sales DC",
            subtitle: "Delivery challans",
            icon: Truck,
            bgColor: "bg-purple-50",
            iconColor: "text-purple-600",
            action: () => navigate("/sales/sales-dc"),
        },
        {
            title: "Sales Invoice",
            subtitle: "Job-linked invoicing",
            icon: FileCheck,
            bgColor: "bg-green-50",
            iconColor: "text-green-600",
            action: () => navigate("/sales/sales-invoice"),
        },
        {
            title: "Direct Invoice",
            subtitle: "Non-job invoices",
            icon: Receipt,
            bgColor: "bg-orange-50",
            iconColor: "text-orange-600",
            action: () => navigate("/sales/performance-invoice"),
        },
        {
            title: "Credit Note",
            subtitle: "Issue credit notes",
            icon: FileMinus,
            bgColor: "bg-red-50",
            iconColor: "text-red-600",
            action: () => navigate("/sales/credit-note"),
        },
        {
            title: "Receipts & Advance",
            subtitle: "Record customer payments",
            icon: CreditCard,
            bgColor: "bg-cyan-50",
            iconColor: "text-cyan-600",
            action: () => navigate("/sales/receipt-advance"),
        },
        {
            title: "Receipts & Bill TO Bill",
            subtitle: "Record customer payments",
            icon: CreditCard,
            bgColor: "bg-cyan-50",
            iconColor: "text-cyan-600",
            action: () => navigate("/sales/receipt"),
        },
         {
            title: "Sales Reports",
            subtitle: "View Sales Reports",
            icon: FileBarChart,
            bgColor: "bg-teal-100",
            iconColor: "text-teal-600",
            isDropdown: true,
        },
    ];

    const dropdownItems = [
        { name: "Quotation Format", path: "/sales/Qt-format" },
        { name: "Sales Report", path: "/sales/sales-report" },
        { name: "Customer Ledger", path: "/sales/customer-Ledger" },
        { name: "DC Format", path: "/sales/stock-report" },
        { name: "Credit Note Format", path: "/sales/credit-note-view" },
        { name: "Invoice Format", path: "/sales/tax-report" },
        { name: "Reciept Format", path: "/sales/Reciept-Format" },
    ];
    return (
         <div className={`min-h-screen overflow-visible transition-all duration-300 ${openDropdown !== null ? "" : ""  }`}>
            {/* Header Section */}
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Sales Module
                </h1>
                <p className="text-gray-500 mt-2 text-lg">
                    Invoicing, quotations, and payment collection
                </p>
            </div>

            {/* Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl">
                {salesOptions.map((option, index) => (
                 <div key={index} className="relative">
                    <SalesCard
                        {...option}
                        onClick={() => {
                            if (option.isDropdown) {
                                setOpenDropdown(openDropdown === index ? null : index);
                            } else if (option.action) {
                                option.action();
                            }
                        }}
                    />
                 
                 {/* dropdown */}

                 {option.isDropdown && openDropdown === index && (
                 <div className="mt-3 w-full bg-white border rounded-xl shadow-xl z-[9999]">
                 {dropdownItems.map((item, i) => (
                 <button
                 key={i}
                  onClick={() =>{ ShowReport(item);
                     setOpenDropdown(null)}}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 hover:text-blue-600 transition">
                {item.name}
                </button>
                ))}
              </div>
               )}
                </div>  
                   
                ))}
        </div>
         <SaleswindowModel
          key={viewtype}
          title={modalTitle}
          isOpen={showModal}
          type={viewtype}
          filters={filters}
          onClose={() => setShowModal(false)}
          isMinimized={isMinimized}
          setIsMinimized={setIsMinimized}
          initialView={initialView}
          onMinimize={() => setShowModal(false)}
           onFilterChange={setFilters}
         >
        {viewtype === "Quotation Format" &&
        <QuotationFormat QtNumber={filters.QtNumber} /> 
        }        
        {viewtype === "Invoice Format" &&
        <InvoiceFormat InvNumber={filters.QtNumber} />
        }        
        {viewtype === "DC Format" &&
        <SalesDCFormat dcNumber={filters.QtNumber} />
        } 
        {viewtype === "Credit Note Format" &&
        <CreditNoteView cnNumber={filters.QtNumber} />
        }
        </SaleswindowModel>

         {showModal && isMinimized && (
        <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999] shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white text-xs font-bold rounded-sm border border-gray-600 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.3)] hover:from-blue-600 hover:to-blue-400 active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all"
          >
            <div className="w-3 h-3 border border-white/50"></div>
            {modalTitle}
          </button>
        </div>
      )}
    </div>
    );
};

export default SalesModule;
