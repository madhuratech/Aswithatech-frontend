import API_BASE_URL from "../../../config/api";
import React, { useEffect, useState, useRef } from "react";
import { Box, RefreshCw, Trash2, Wrench, ChevronDown } from "lucide-react";
import { useNavigate, Outlet } from "react-router-dom";
import PCBStockReportModal from "../../ui/reports/PCBStockReportModal";
import StandbyPCBStockReportModal from "../../ui/reports/StandbyPCBStockReportModal";
import ScrapDamageReportModal from "../../ui/reports/ScrapDamageReportModal";
import SpareUsageReportModal from "../../ui/reports/SpareUsageReportModal";

const ModuleCard = ({ title, subtitle, icon: Icon, bgColor, iconColor, onClick }) => {
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

const StatSmallCard = ({ title, value, valueColor = "text-gray-900" }) => {
    return (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {title}
            </p>
            <h4 className={`text-2xl font-bold mt-2 ${valueColor}`}>
                {value}
            </h4>
        </div>
    );
};

const ProductionStock = () => {
    const navigate = useNavigate();
    const [summary, setSummary] = useState({
        total_pcb_stock: "-",
        standby_available: "-",
        standby_issued: "-",
        under_repair: "-",
    });
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeModal, setActiveModal] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        fetch(`${API_BASE_URL}/pcb-stock/summary`)
            .then((r) => r.json())
            .then((data) => setSummary(data))
            .catch(console.error);
    }, []);

    const modules = [
        {
            title: "PCB Stock",
            subtitle: "Main PCB inventory",
            icon: Box,
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
            action: () => navigate("/production/pcb-stock"),
        },
        {
            title: "Standby PCB Stock",
            subtitle: "Standby inventory status",
            icon: RefreshCw,
            bgColor: "bg-green-50",
            iconColor: "text-green-600",
            action: () => navigate("/production/standby-pcb"),
        },
        {
            title: "Scrap / Damaged PCBs",
            subtitle: "Track damaged inventory",
            icon: Trash2,
            bgColor: "bg-red-50",
            iconColor: "text-red-600",
            action: () => navigate("/production/scrap-pcb"),
        },
        {
            title: "Spare Usage",
            subtitle: "Track component consumption",
            icon: Wrench,
            bgColor: "bg-purple-50",
            iconColor: "text-purple-600",
            action: () => navigate("/production/spare-stock"),
        },
    ];

    const reportItems = [
        { label: "PCB Stock Report", modalKey: "pcb" },
        { label: "Standby PCB Stock Report", modalKey: "standby" },
        { label: "Scrap / Damaged PCB Report", modalKey: "scrap" },
        { label: "Spare Usage Report", modalKey: "spare" },
    ];

    const stats = [
        { title: "Total PCB Stock", value: summary.total_pcb_stock, color: "text-gray-900" },
        { title: "Standby Available", value: summary.standby_available, color: "text-green-600" },
        { title: "Standby Issued", value: summary.standby_issued, color: "text-orange-500" },
        { title: "Under Repair", value: summary.under_repair, color: "text-blue-600" },
    ];

    return (
        <div className="pb-10 p-10 min-h-screen">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Production & Stock
                </h1>
                <p className="text-gray-500 mt-2 text-lg">
                    Inventory and stock management
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mb-6">
                {modules.map((mod, index) => (
                    <ModuleCard
                        key={index}
                        title={mod.title}
                        subtitle={mod.subtitle}
                        icon={mod.icon}
                        bgColor={mod.bgColor}
                        iconColor={mod.iconColor}
                        onClick={mod.action}
                    />
                ))}
            </div>

            {/* Production Reports Dropdown */}
            <div className="max-w-5xl mb-10 relative" ref={dropdownRef}>
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-sm font-semibold text-gray-700"
                >
                    <ChevronDown size={16} className={`transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                    Production Reports
                </button>
                {showDropdown && (
                    <div className="absolute left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                        {reportItems.map((item, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setActiveModal(item.modalKey);
                                    setShowDropdown(false);
                                }}
                                className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <PCBStockReportModal isOpen={activeModal === "pcb"} onClose={() => setActiveModal(null)} />
            <StandbyPCBStockReportModal isOpen={activeModal === "standby"} onClose={() => setActiveModal(null)} />
            <ScrapDamageReportModal isOpen={activeModal === "scrap"} onClose={() => setActiveModal(null)} />
            <SpareUsageReportModal isOpen={activeModal === "spare"} onClose={() => setActiveModal(null)} />

            <div className="max-w-6xl">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Inventory Summary
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, index) => (
                        <StatSmallCard
                            key={index}
                            title={stat.title}
                            value={stat.value}
                            valueColor={stat.color}
                        />
                    ))}
                </div>
            </div>
            <Outlet />
        </div>
    );
};

export default ProductionStock;
