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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ServiceWindowModal from "../ui/servicewindowModal";

const Statcard = () => {
  const navigate = useNavigate();

  const [showDcModal, setShowDcModal] = React.useState(false);
  const [dcNo, setDcNo] = React.useState("");
  const [dcMinimized, setDcMinimized] = React.useState(false);

  const Card = ({ title, icon, action }) => (
    <div 
      onClick={action} 
      className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
    >
      <div>
        <p className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
          {title}
        </p>
      </div>
      <div className="flex-shrink-0 dashboard-card-icon-wrapper">
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
      action: () => navigate("/sales/sales-view-report")
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
      action: () => navigate("/sales/sales-report", { state: { activeTab: "pending" } })
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
      action: () => navigate("/purchase/purchase-view-report") 
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
      action: () => navigate("/job/job-dc")
    },
    {
      title: "Job Return Entry",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 transition-colors group-hover:bg-cyan-100">
          <RotateCw size={22} />
        </div>
      ),
      action: () => navigate("/job/job-return-dc")
    },
    {
      title: "Job Pending Details",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-100">
          <Users size={22} />
        </div>
      ),
      action: () => navigate("/job/job-details")
    },
    {
      title: "Standby DC Entry",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100">
          <Cpu size={22} />
        </div>
      ),
      action: () => navigate("/standby/standby-dc")
    },
    {
      title: "Standby Return DC",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 transition-colors group-hover:bg-cyan-100">
          <RotateCw size={22} />
        </div>
      ),
      action: () => navigate("/standby/standby-return-dc")
    },
    {
      title: "Standby Pending",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-100">
          <Clock size={22} />
        </div>
      ),
      action: () => navigate("/standby/standby-details")
    },
    {
      title: "Format View",
      icon: (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100">
          <FileCheck size={22} />
        </div>
      ),
      action: () => {
        setDcNo("");
        setDcMinimized(false);
        setShowDcModal(true);
      }
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <Card
            key={index}
            title={card.title}
            icon={card.icon}
            action={card.action}
          />
        ))}
      </div>

      {/* DC Format View Modal */}
      <ServiceWindowModal
        title="DC Format View"
        isOpen={showDcModal}
        type="DC Format View"
        isMinimized={dcMinimized}
        onMinimize={() => setDcMinimized(true)}
        onClose={() => { setShowDcModal(false); setDcMinimized(false); }}
        filters={{ dcNumber: dcNo }}
        onFilterChange={(f) => setDcNo(f.dcNumber || dcNo)}
      />

      {/* Minimized DC Bar */}
      {showDcModal && dcMinimized && (
        <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#e0e0e0] border-t border-gray-400 flex items-center px-4 z-[99999] shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          <button
            onClick={() => setDcMinimized(false)}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white text-xs font-bold rounded-sm border border-gray-600 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.3)] hover:from-blue-600 hover:to-blue-400 active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all"
          >
            <div className="w-3 h-3 border border-white/50"></div>
            DC Format View
          </button>
        </div>
      )}

      <style>{`
        .dashboard-card-icon-wrapper > div {
          width: 2.25rem !important;
          height: 2.25rem !important;
          border-radius: 0.5rem !important;
        }
        .dashboard-card-icon-wrapper svg {
          width: 18px !important;
          height: 18px !important;
        }
      `}</style>
    </>
  );
};

export default Statcard;