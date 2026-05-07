import {
  Plus,
  ClipboardList,
  ArrowLeftRight,
  Truck,
  FileBarChart,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ServiceModule = () => {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);

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

  const servicecards = [
    {
      title: "Inward Entry",
      desc: "Create new service job",
      icon: Plus,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      action: () =>navigate("/services/inward-entry"),
    },
    {
      title: "DC Entry",
      desc: "View all service jobs",
      icon: ClipboardList,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      action: () =>navigate("/services/service-dc"),
    },
    {
      title: "Service Invoice",
      desc: "Issue and track standby PCBs",
      icon: ArrowLeftRight,
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      action: () =>navigate("/services/service-invoice"),
    },
    {
      title: "Pending",
      desc: "Delivery challan tracking",
      icon: Truck,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
      action: () =>navigate("/services/pending"),
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
    { name: "Service Performance Report", path: "/services/performance-report" },
    { name: "Job Status Report", path: "/services/job-status-report" },
  ];

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
        Service Module
      </h1>
      <p className="text-gray-500 mt-1">
        Core PCB service operations and job management
      </p>

      {/* Cards – FULL WIDTH */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mt-6">
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
                 
                 {/* dropdown */}

                 {option.isDropdown && openDropdown === index && (
                 <div className="mt-3 w-full bg-white border rounded-xl shadow-xl z-[9999]">
                 {dropdownItems.map((item, i) => (
                 <button
                 key={i}
                  onClick={() =>{ 
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
    </div>
  );
}

export default ServiceModule;
