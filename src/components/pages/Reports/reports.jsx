import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, IndianRupee, Users, AlertTriangle, ArrowRight } from "lucide-react";
import API_BASE_URL from "../../../config/api";

const Reports = () => {
  const navigate = useNavigate();
  const [pendingQty,       setPendingQty]       = useState("...");
  const [pendingCustomers, setPendingCustomers] = useState("...");

  useEffect(() => {
    fetch(`${API_BASE_URL}/pendings/list`)
      .then((r) => r.json())
      .then((d) => {
        if (!Array.isArray(d)) return;
        const qty       = d.reduce((s, r) => s + Number(r.pending_qty || 0), 0);
        const customers = new Set(d.map((r) => r.customer_name)).size;
        setPendingQty(qty);
        setPendingCustomers(customers);
      })
      .catch(() => { setPendingQty("—"); setPendingCustomers("—"); });
  }, []);

  const Reportcard = ({ title, value, icons, onClick, highlight }) => (
    <div
      onClick={onClick}
      className={`rounded-xl border bg-white text-black p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group
        ${highlight ? "border-red-200 hover:border-red-400" : "border-black/10 hover:border-blue-200"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-lg font-semibold leading-5 transition-colors
            ${highlight ? "text-red-700 group-hover:text-red-600" : "text-gray-900 group-hover:text-blue-600"}`}>
            {title}
          </p>
          <h3 className="text-2xl font-semibold leading-7 mt-2">{value}</h3>
          {onClick && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-500 mt-2 group-hover:text-blue-700">
              View Report <ArrowRight className="w-3 h-3" />
            </span>
          )}
        </div>
        <div className="text-2xl text-gray-400">{icons}</div>
      </div>
    </div>
  );

  const cards = [
    { title: "Total Jobs",        value: "",              icons: <FileText      className="bg-[#EFF6FF] text-[#155DFC] w-[40px] h-[40px] px-2 rounded-lg" /> },
    { title: "Active Customers",  value: "",              icons: <Users         className="bg-[#F0FDF4] text-[#00A63E] w-[40px] h-[40px] px-2 rounded-lg" /> },
    { title: "Total Revenue",     value: "",              icons: <IndianRupee   className="bg-[#FAF5FF] text-[#9810FA] w-[40px] h-[40px] px-2 rounded-lg" /> },
    { title: "Avg Turnaround",    value: "",              icons: <Clock         className="bg-[#FFF7ED] text-[#F54900] w-[40px] h-[40px] px-2 rounded-lg" /> },
  ];

  return (
    <div className="min-h-screen p-10">
      <div className="mb-8">
        <h6 className="text-3xl font-bold text-gray-900 tracking-tight">Reports & Analytics</h6>
      </div>

      {/* Existing report cards */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        {cards.map((item, i) => (
          <Reportcard key={i} title={item.title} value={item.value} icons={item.icons} />
        ))}
      </div>

      {/* Pending Report Section */}
      <div className="mb-4">
        <h6 className="text-[13px] font-black uppercase tracking-widest text-gray-500 mb-4">Pending Reports</h6>
        <div className="grid grid-cols-4 gap-6">

          {/* Pending Deliveries Card */}
          <div
            onClick={() => navigate("/reports/pending")}
            className="col-span-1 rounded-xl border border-red-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-red-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-lg font-semibold text-red-700 leading-5 group-hover:text-red-600">
                  Pending Deliveries
                </p>
                <h3 className="text-2xl font-semibold leading-7 mt-2 text-red-600">{pendingQty}</h3>
                <p className="text-[12px] text-gray-400 mt-1">{pendingCustomers} customer(s) pending</p>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-500 mt-2 group-hover:text-blue-700">
                  View Full Report <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <AlertTriangle className="bg-[#FEF2F2] text-[#E7000B] w-[40px] h-[40px] px-2 rounded-lg flex-shrink-0" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Reports;
