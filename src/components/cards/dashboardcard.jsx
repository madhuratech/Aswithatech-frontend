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
      title: "Purchase Order",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
          <FileCheck size={22} />
        </div>
      ),
      action: () => navigate("/purchase/orders") 
    },
    { 
      title: "Debit Note",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-100">
          <FileMinus size={22} />
        </div>
      ),
      action: () => navigate("/purchase/debit")
    },
    { 
      title: "Credit Note",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-50 text-green-600 transition-colors group-hover:bg-green-100">
          <FilePlus size={22} />
        </div>
      ),
      action: () => navigate("/sales/credit") 
    },
    { 
      title: "PCB Stock", 
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100">
          <Cpu size={22} />
        </div>
      ),
      action: () => navigate("/production/pcb-stock")
    },
    { 
      title: "BillWise Payment", 
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
          <CreditCard size={22} />
        </div>
      ),
      action: () => navigate("/purchase/billwise") 
    },
    { 
      title: "Standby Stock", 
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 transition-colors group-hover:bg-cyan-100">
          <RotateCw size={22} />
        </div>
      ),
      action: () => navigate("/production/standby-stock") 
    },
    { 
      title: "Customer Ledger", 
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-100">
          <Users size={22} />
        </div>
      ),
      action: () => navigate("/purchase/supplier-ledger") 
    },
    { 
      title: "Pending Reports", 
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
          <Clock size={22} />
        </div>
      ),
      action: () => navigate("/reports") 
    },
    { 
      title: "Monthly Report", 
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-100">
          <IndianRupee size={22} />
        </div>
      ),
      action: () => navigate("/purchase/tax-report") 
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