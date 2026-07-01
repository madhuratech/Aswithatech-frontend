import API_BASE_URL from "../../../config/api";
import {
  Plus,
  ClipboardList,
  ArrowLeftRight,
  Truck,
  FileBarChart,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import ServiceWindowModal from "../../ui/servicewindowModal";
import DeliveryChallan from "./dcFormat";
import InvoiceFormat from "./invoiceFormat";
import InwardReport from "./InwardReport";
const SalesCard = ({ title, subtitle, icon: Icon, bgColor, iconColor, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3.5 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
    >
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${bgColor}`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
};

const ServiceModule = () => {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openDCModal, setOpenDCModal] = useState(false);
  const [openInwardReport, setOpenInwardReport] = useState(false);
  const [selectedDC, setSelectedDC] = useState("");
  const [viewtype, setviewtype] = useState("");
  const [modeltitle, setmodeltitle] = useState();
  const [isMinimized, setMinimized] = useState(false);
  const [initialView, setInitialView] = useState("DC");

  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    dcNumber: "",
  });

  const openReport = async (title, type, mode = "dc") => {
    setmodeltitle(title);
    setInitialView(mode);
    let number = "";

    try {
      if (title === "DC Format") {
        const res = await fetch(`${API_BASE_URL}/servicedcentry/DC/search?q=`);
        const data = await res.json();
        number = data[0]?.dc_number || data[0]?.inward_dc_no || "";
        setFilters((prev) => ({ ...prev, dcNumber: number }));
        setSelectedDC(number);
      } else if (type === "dc") {
        const res = await fetch(`${API_BASE_URL}/servicedcentry/IE/search?q=`);
        const data = await res.json();
        number = data[0]?.dc_number || data[0]?.inward_dc_no || "";
        setFilters((prev) => ({ ...prev, dcNumber: number }));
        setSelectedDC(number);
      } else if (type === "invoice") {
        const res = await fetch(`${API_BASE_URL}/serviceinvoice/search-invoice?q=`);
        const data = await res.json();
        number = data[0]?.invoice_no || "";
        setFilters((prev) => ({ ...prev, dcNumber: number }));
        setSelectedDC(number);
      }
    } catch (err) {
      console.error(err);
    }

    setviewtype(type);
    setOpenDCModal(true);
    setMinimized(false);
  };

  const showReport = (item) => {
    if (item.name === "DC Format") {
      openReport(item.name, "dc", "dc");
    } else if (item.name === "Invoice Format") {
      openReport(item.name, "invoice", "dc");
    } else if (item.name === "Inward Report") {
      setOpenInwardReport(true);
    } else {
      navigate(item.path);
    }
  };

  const servicecards = [
    {
      title: "Inward Entry",
      desc: "Create new service job",
      icon: Plus,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      action: () => navigate("/services/inward-entry"),
    },
    {
      title: "DC Entry",
      desc: "View all service jobs",
      icon: ClipboardList,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      action: () => navigate("/services/service-dc"),
    },
    {
      title: "Service Invoice",
      desc: "Issue and track standby PCBs",
      icon: ArrowLeftRight,
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      action: () => navigate("/services/service-invoice"),
    },
    {
      title: "Pending",
      desc: "Delivery challan tracking",
      icon: Truck,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
      action: () => navigate("/services/pending"),
    },
    {
      title: "Service Reports",
      subtitle: "View Service Reports",
      icon: FileBarChart,
      bgColor: "bg-teal-100",
      iconColor: "text-teal-600",
      isDropdown: true,
    },
  ];

  const dropdownItems = [
    { name: "DC Format", path: "/services/dc-format" },
    { name: "Invoice Format", path: "/services/invoice-format" },
    { name: "Inward Report", path: "/services/inward-report" },
  ];

  return (
    <div className="min-h-screen ">
      <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
        Service Module
      </h1>
      <p className="text-gray-500 mt-1">
        Core PCB service operations and job management
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6 p-5">
        {servicecards.map((option, index) => (
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

            {option.isDropdown && openDropdown === index && (
              <div className="mt-3 w-full bg-white border rounded-xl shadow-xl z-[9999]">
                {dropdownItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      showReport(item);
                      setOpenDropdown(null);
                    }}
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

      {/* DC / Invoice window modal */}
      <ServiceWindowModal
        key={viewtype}
        title={modeltitle}
        isOpen={openDCModal}
        viewtype={viewtype}
        type={modeltitle}
        initialView={initialView}
        isMinimized={isMinimized}
        setMinimized={setMinimized}
        filters={filters}
        onMinimize={() => setMinimized(true)}
        onClose={() => setOpenDCModal(false)}
        onFilterChange={(filters) => { setSelectedDC(filters.dcNumber); }}>
        {viewtype === "dc" &&
          <DeliveryChallan key={selectedDC} dcNumber={selectedDC} />}
        {viewtype === "invoice" &&
          <InvoiceFormat key={selectedDC} dcNumber={selectedDC} />}
      </ServiceWindowModal>

      {/* Minimise bar for DC/Invoice modal */}
      {openDCModal && isMinimized && (
        <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999] shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          <button
            onClick={() => setMinimized(false)}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white text-xs font-bold rounded-sm border border-gray-600 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.3)] hover:from-blue-600 hover:to-blue-400 active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all"
          >
            <div className="w-3 h-3 border border-white/50"></div>
            {modeltitle}
          </button>
        </div>
      )}

      {/* Inward Report standalone modal */}
      {openInwardReport && (
        <InwardReport
          title="Inward Details Report"
          onClose={() => setOpenInwardReport(false)}
          onMinimize={() => setOpenInwardReport(false)}
        />
      )}
      <Outlet />
    </div>
  );
}

export default ServiceModule;
