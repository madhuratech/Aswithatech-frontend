import API_BASE_URL from "../../../config/api";
import React, { useEffect, useState } from "react";
import { Box, RefreshCw, Trash2, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
/**
 * ModuleCard - A reusable card for main production modules
 */
const ModuleCard = ({ title, subtitle, icon: Icon, bgColor, iconColor, onClick }) => {
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

/**
 * StatSmallCard - A smaller card for inventory statistics
 */
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

    const stats = [
        { title: "Total PCB Stock", value: summary.total_pcb_stock, color: "text-gray-900" },
        { title: "Standby Available", value: summary.standby_available, color: "text-green-600" },
        { title: "Standby Issued", value: summary.standby_issued, color: "text-orange-500" },
        { title: "Under Repair", value: summary.under_repair, color: "text-blue-600" },
    ];

    return (
        <div className="pb-10 p-10 min-h-screen">
            {/* Header Section */}
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Production & Stock
                </h1>
                <p className="text-gray-500 mt-2 text-lg">
                    Inventory and stock management
                </p>
            </div>

            {/* Module Navigation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mb-10">
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

            {/* Stats Summary Section */}
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
        </div>
    );
};

export default ProductionStock;
