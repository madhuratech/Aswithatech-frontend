import API_BASE_URL from "../../../config/api";
import React, { useState } from "react";
import {
  ShoppingCart,
  FileText,
  Wallet,
  FileBarChart,
  CreditCard,
  Receipt,
  ClipboardCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import WindowModal from "../../ui/WindowModal";
import PurchaseOrderFormat from "./purchaseorderview";
import Debitnoteview from "./debitnoteview";
import Billwiseformat from "./bilwisepaymentformat";
/* 🔹 Card */
const PurchaseCard = ({
  title,
  description,
  icon: Icon,
  bgColor,
  iconColor,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-5 p-6 bg-white border rounded-xl shadow-sm hover:shadow-md cursor-pointer transition"
    >
      <div className={`w-14 h-14 flex items-center justify-center rounded-xl ${bgColor}`}>
        <Icon size={26} className={iconColor} />
      </div>

      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
};

/* 🔹 Main */
const Purchase = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
   const [viewType, setViewType] = useState("po");

  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    poNumber: "",
    dnNumber: ""
  });



const [initialView, setInitialView] = useState("po");

const openReport = async (title, type, mode = "po") => {
  setModalTitle(title);
  setInitialView(mode);
  let number = "";

  try {
    if (type === "po") {
      const res = await fetch(`${API_BASE_URL}/purchaseorders/po/search?q=`);
      const data = await res.json();
      number = data[0]?.po_number || "";

      setFilters(prev => ({ ...prev, poNumber: number }));
    }

    if (type === "dn") {
      const res = await fetch(`${API_BASE_URL}/debitnotes/dn/search?q=`);
      const data = await res.json();
      number = data[0]?.dn_number || "";

      setFilters(prev => ({ ...prev, dnNumber: number }));
    }

    if (type === "billwise") {
      const res = await fetch(`${API_BASE_URL}/billpayment/allbills`);
      const data = await res.json();
      number = data[0]?.bill_no || "";

      setFilters(prev => ({ ...prev, billNumber: number }));
    }

  } catch (err) {
    console.error(err);
  }

  setViewType(type);
  setIsModalOpen(true);
  setIsMinimized(false);
};


const ShowReport = (item) => {
  if (item.name === "Purchase Order Format") {
    openReport(item.name, "po", "po");
  } else if (item.name === "Debit Note Format") {
    openReport(item.name, "dn", "po");
  } else if (item.name === "Purchase Order Report") {
    openReport(item.name, "po", "report");
  } else if (item.name === "Debit Note Report") {
    openReport(item.name, "dn", "report");
  } 
  else if(item.name === "Payment Format"){
     openReport(item.name, "billwise", "po");
  }
  else {
    navigate(item.path);
  }
};



  const purchaseOptions = [
    {
      title: "Purchase item",
      description: "Record component purchases",
      icon: ShoppingCart,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      action: () => navigate("/purchase/stock"),
    },
    {
      title: "Purchase Order",
      description: "Manage purchase orders",
      icon: FileText,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      action: () => navigate("/purchase/orders"),
    },
    {
      title: "Debit Note",
      description: "Issue debit notes",
      icon: Receipt,
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
      action: () => navigate("/purchase/debit"),
    },
    {
      title: "Supplier advance",
      description: "Track advance payments",
      icon: Wallet,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      action: () => navigate("/purchase/supplier"),
    },
    {
      title: "Tax Purchase Entry",
      description: "GST purchase entries",
      icon: ClipboardCheck,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
      action: () => navigate("/purchase/tax"),
    },
    {
      title: "Bilwise Payment",
      description: "Track bill payments",
      icon: CreditCard,
      bgColor: "bg-indigo-100",
      iconColor: "text-indigo-600",
     action: () =>navigate("/purchase/billwise"),
    },
    {
      title: "Purchase Report",
      description: "View reports",
      icon: FileBarChart,
      bgColor: "bg-teal-100",
      iconColor: "text-teal-600",
      isDropdown: true,
    },
  ];

  const dropdownItems = [
    { name: "Purchase Order Format", path: "/purchase/po-format" },
    { name: "Debit Note Format", path: "/purchase/debitnote-view" },
    { name: "Supplier Ledger", path: "/purchase/supplier-ledger" },
    { name: "Monthly Report", path: "/purchase/monthly-statement"},
    { name: "Payment Format", path: "/purchase/bill-format"},
  ];

  return (
    <div
      className={`min-h-screen overflow-visible transition-all duration-300 ${openDropdown !== null ? "pb-32" : ""
        }`}
    >

      <h1 className="text-3xl font-bold mb-8">Purchase Module</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl">
        {purchaseOptions.map((option, index) => (
          <div key={index} className="relative">

            <PurchaseCard
              {...option}
              onClick={() => {
                if (option.isDropdown) {
                  setOpenDropdown(openDropdown === index ? null : index);
                } else if (option.action) {
                  option.action();
                }
              }}
            />

            {/* 🔽 Dropdown */}
            {option.isDropdown && openDropdown === index && (
              <div className="absolute top-full mt-3 left-0 w-full bg-white border rounded-xl shadow-xl z-[9999]">
                {dropdownItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { ShowReport(item); setOpenDropdown(null)}}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 hover:text-blue-600 transition"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}

          </div>
        ))}
      </div>

      <WindowModal
        key={viewType} 
        title={modalTitle}
        isOpen={isModalOpen}
        type={viewType}
        initialViewMode={initialView}
        isMinimized={isMinimized}
        onMinimize={() => setIsMinimized(true)}
        onClose={() => setIsModalOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
      >
        {viewType === "po" ? (
          <PurchaseOrderFormat poNumber={filters.poNumber} />
        ) : viewType === "dn" ? (
          <Debitnoteview dnNumber={filters.dnNumber} />
        ) : viewType === "billwise" ? (
        <Billwiseformat billNo={filters.billNumber} />
        ) : null}
      </WindowModal>


      {/* 🔽 TASKBAR FOR MINIMIZED WINDOWS */}
      {isModalOpen && isMinimized && (
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

export default Purchase;
