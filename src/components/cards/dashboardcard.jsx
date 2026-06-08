import React from "react";
import {
  FileCheck,
  FileMinus,
  FilePlus,
  Cpu,
  CreditCard,
  RotateCw,
  Users,
  Clock,
  IndianRupee,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Statcard = () => {
  const navigate = useNavigate();

  const Card = ({ title, icon, action }) => (
    <div 
      onClick={action} 
      className="flex items-center justify-between p-6 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
    >
      <div>
        <p className="text-lg font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
          {title}
        </p>
      </div>
      <div className="flex-shrink-0">
        {icon}
      </div>
    </div>
  );

  const cards = [
    { 
      title: "Quotation View",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
          <FileCheck size={22} />
        </div>
      ),
      action: () => navigate("/sales/sales-invoice") 
    },
    { 
      title: "Sales View",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-50 text-green-600 transition-colors group-hover:bg-green-100">
          <FilePlus size={22} />
        </div>
      ),
      action: () => navigate("/sales")
    },
    { 
      title: "Direct Invoice",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
          <CreditCard size={22} />
        </div>
      ),
      action: () => navigate("/sales/performance-invoice") 
    },
    {
      title: "Bill Pending",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
          <Clock size={22} />
        </div>
      ),
      action: () => navigate("/sales/customer-Ledger", { state: { ledgerType: "outstanding" } })
    },
    { 
      title: "Over Due", 
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-100">
          <FileMinus size={22} />
        </div>
      ),
      action: () => navigate("/sales/customer-Ledger", { state: { ledgerType: "outstanding" } }) 
    },
    {
      title: "All Accounts View",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-100">
          <Users size={22} />
        </div>
      ),
      action: () => navigate("/sales/customer-Ledger", { state: { ledgerType: "ledger" } })
    },
    { 
      title: "Purchase View", 
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
          <FileCheck size={22} />
        </div>
      ),
      action: () => navigate("/purchase") 
    },
    { 
      title: "Purchase Bill Pending", 
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
          <CreditCard size={22} />
        </div>
      ),
      action: () => navigate("/purchase/billwise") 
    },
    {
      title: "Pending Service",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
          <Clock size={22} />
        </div>
      ),
      action: () => navigate("/services/pending")
    },
    {
      title: "Job DC Entry",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100">
          <Cpu size={22} />
        </div>
      ),
      action: () => navigate("/services/service-dc")
    },
    {
      title: "Return DC Entry",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 transition-colors group-hover:bg-cyan-100">
          <RotateCw size={22} />
        </div>
      ),
      action: () => navigate("/services/service-dc")
    },
    {
      title: "Job Details",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-100">
          <Users size={22} />
        </div>
      ),
      action: () => navigate("/services")
    },
    {
      title: "Standby DC Entry",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100">
          <Cpu size={22} />
        </div>
      ),
      action: () => navigate("/production/standby-pcb", { state: { activeTab: "form", status: "Allocated" } })
    },
    {
      title: "Standby Return DC",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 transition-colors group-hover:bg-cyan-100">
          <RotateCw size={22} />
        </div>
      ),
      action: () => navigate("/production/standby-pcb", { state: { activeTab: "form", status: "Returned" } })
    },
    {
      title: "Standby Pending",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-100">
          <Clock size={22} />
        </div>
      ),
      action: () => navigate("/production/standby-pcb", { state: { activeTab: "reports", reportType: "allocated" } })
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <Card
          key={index}
          title={card.title}
          icon={card.icon}
          action={card.action}
        />
      ))}
    </div>
  );
};

export default Statcard;