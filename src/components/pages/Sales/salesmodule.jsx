import API_BASE_URL from "../../../config/api";
import React, { useState } from "react";
import { FileText, Truck, FileCheck, Receipt, FileMinus, CreditCard, FileBarChart } from "lucide-react";
import { useNavigate, Outlet } from "react-router-dom";
import SaleswindowModel from "../../ui/saleswindowModal";
import QuotationFormat from "./quotationoverview";
import InvoiceFormat from "./invoiceformat";
import SalesDCFormat from "./salesdcformat";
import CreditNoteView from "./creditnote";
import PerformanceInvoiceLayout2 from "./performanceinvoiceformat2";
import ServiceInvoiceFormat from "../Services/invoiceFormat";
import ServiceDCFormat from "../Services/dcFormat";
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

const SalesModule = () => {
    const navigate = useNavigate();
    const [openDropdown, setOpenDropdown] = React.useState(null);
    const [showModal, setShowModal] = React.useState(false);
    const [viewtype, setviewtype] = React.useState("");
    const [modalTitle, setModalTitle] = useState("");
    const [isMinimized, setIsMinimized] = useState(false);
    const [initialView] = useState("qt");
    const [modalKey, setModalKey] = useState(0);
    const [filters, setFilters] = useState({
        fromDate: "",
        toDate: "",
        QtNumber: ""
    });
    const [detectedInvoiceType, setDetectedInvoiceType] = React.useState("SalesInvoice");
    const [detectedDcType, setDetectedDcType] = React.useState("SalesDC");

    React.useEffect(() => {
        if (!filters.QtNumber || viewtype !== "DC Format") {
            return;
        }
        const fetchDcType = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/salesdc/full/${encodeURIComponent(filters.QtNumber)}`);
                if (res.ok) {
                    setDetectedDcType("SalesDC");
                } else {
                    const serviceRes = await fetch(`${API_BASE_URL}/servicedcentry/full/${encodeURIComponent(filters.QtNumber)}`);
                    if (serviceRes.ok) {
                        setDetectedDcType("ServiceDC");
                    } else {
                        setDetectedDcType("SalesDC");
                    }
                }
            } catch (err) {
                console.error("Error fetching DC type:", err);
                setDetectedDcType("SalesDC");
            }
        };
        fetchDcType();
    }, [filters.QtNumber, viewtype]);



    React.useEffect(() => {
        if (!filters.QtNumber || (viewtype !== "Invoice Format" && viewtype !== "Direct Invoice Format")) {
            return;
        }
        const fetchType = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/salesinvoices/INV/type/${encodeURIComponent(filters.QtNumber)}`);
                if (res.ok) {
                    const data = await res.json();
                    setDetectedInvoiceType(data.invoiceType);
                } else {
                    setDetectedInvoiceType("SalesInvoice");
                }
            } catch (err) {
                console.error("Error fetching invoice type:", err);
                setDetectedInvoiceType("SalesInvoice");
            }
        };
        fetchType();
    }, [filters.QtNumber, viewtype]);



    const openReport = async (type) => {

        setModalTitle(type);

        try {

            let latestNumber = "";

            if (type === "Quotation Format") {

                const res = await fetch(
                    `${API_BASE_URL}/quotations/QT/search?q=`
                );

                const data = await res.json();

                latestNumber = data[0]?.quotation_no || "";
            }

            if (type === "Invoice Format") {

                const res = await fetch(
                    `${API_BASE_URL}/salesinvoices/INV/search?q=`
                );

                const data = await res.json();

                latestNumber = data[0]?.invoice_no || "";
            }

            if (type === "DC Format") {
                try {
                    const [salesRes, serviceRes] = await Promise.all([
                        fetch(`${API_BASE_URL}/salesdc/DC/search?q=`),
                        fetch(`${API_BASE_URL}/servicedcentry/DC/search?q=`)
                    ]);
                    const salesData = await salesRes.json();
                    const serviceData = await serviceRes.json();

                    const latestSalesNo = salesData[0]?.dc_no || "";
                    const latestServiceNo = serviceData[0]?.dc_number || "";

                    const salesNum = parseInt(latestSalesNo, 10) || 0;
                    const serviceNum = parseInt(latestServiceNo, 10) || 0;

                    latestNumber = salesNum >= serviceNum ? latestSalesNo : latestServiceNo;
                } catch (error) {
                    console.error("Error fetching latest DC number:", error);
                }
            }
            if (type === "Credit Note Format") {

                const res = await fetch(
                    `${API_BASE_URL}/creditnotes/cn/search?q=`
                );

                const data = await res.json();

                latestNumber = data[0]?.cn_number || "";
            }

            if (type === "Direct Invoice Format") {
                const res = await fetch(
                    `${API_BASE_URL}/directinvoices/INV/search?q=`
                );
                const data = await res.json();
                latestNumber = data[0]?.invoice_no || "";
            }

            if (type === "PI2 Format") {
                const res = await fetch(
                    `${API_BASE_URL}/performanceinvoices2/INV/search?q=`
                );
                const data = await res.json();
                latestNumber = data[0]?.invoice_no || "";
            }

            setFilters({
                fromDate: "",
                toDate: "",
                clientName: "",
                QtNumber: latestNumber
            });

            setviewtype(type);

            setModalKey(prev => prev + 1);
            setShowModal(true);

        } catch (error) {

            console.error("Error fetching latest document:", error);

        }
    };

    const ShowReport = (item) => {
        if (item.name === "Quotation Format" || item.name === "Invoice Format" || item.name === "DC Format" || item.name === "Credit Note Format" || item.name === "Direct Invoice Format" || item.name === "PI2 Format") {
            openReport(item.name);
        }
        else {
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
            title: "Performance Invoice 2",
            subtitle: "Separate PI2 invoicing",
            icon: Receipt,
            bgColor: "bg-yellow-50",
            iconColor: "text-yellow-600",
            action: () => navigate("/sales/performance-invoice-2"),
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
        { name: "Direct Invoice Format", path: "/sales/direct-invoice-format" },
        { name: "Reciept Format", path: "/sales/Reciept-Format" },
        { name: "PI2 Format", path: "/sales/pi2-report" },
    ];
    return (
        <div className={`min-h-screen overflow-visible transition-all duration-300 ${openDropdown !== null ? "" : ""}`}>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl">
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
                                        onClick={() => {
                                            ShowReport(item);
                                            setOpenDropdown(null)
                                        }}
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
                key={modalKey}
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
                {viewtype === "Invoice Format" && (
                    detectedInvoiceType === "ServiceInvoice" ? (
                        <ServiceInvoiceFormat dcNumber={filters.QtNumber} />
                    ) : (
                        <InvoiceFormat InvNumber={filters.QtNumber} />
                    )
                )}
                {viewtype === "DC Format" && (
                    detectedDcType === "ServiceDC" ? (
                        <ServiceDCFormat dcNumber={filters.QtNumber} />
                    ) : (
                        <SalesDCFormat dcNumber={filters.QtNumber} />
                    )
                )}
                {viewtype === "Credit Note Format" &&
                    <CreditNoteView cnNumber={filters.QtNumber} />
                }
                {viewtype === "Direct Invoice Format" && (
                    detectedInvoiceType === "ServiceInvoice" ? (
                        <ServiceInvoiceFormat dcNumber={filters.QtNumber} />
                    ) : (
                        <InvoiceFormat InvNumber={filters.QtNumber} />
                    )
                )}
                {viewtype === "PI2 Format" &&
                    <PerformanceInvoiceLayout2 InvNumber={filters.QtNumber} />
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
            <Outlet />
        </div>
    );
};

export default SalesModule;
