import React, { useEffect, useState } from "react";
import {
import API_BASE_URL from "../../../config/api";
  Users,
  UserCog,
  Wrench,
  Box,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const formatCurrency = (amount) => {
  return "₹" + Number(amount).toLocaleString("en-IN");
};

const Reports = () => {
  const [data, setData] = useState({
    customers: 0,
    employees: 0,
    services: 0,
    spares: 0,
    expenses: 0,
  });
  const [expenseSummary, setExpenseSummary] = useState({
    totalAmount: 0,
    totalCount: 0,
    byCategory: [],
  });
  const [expenseOpen, setExpenseOpen] = useState(false);

  const fetchCounts = async () => {
    try {
      const [custRes, empRes, svcRes, sprRes, expRes] = await Promise.all([
        fetch(`${API_BASE_URL}/customers/all`),
        fetch(`${API_BASE_URL}/employees/all`),
        fetch(`${API_BASE_URL}/Services/all`),
        fetch(`${API_BASE_URL}/Sparemodels/all`),
        fetch(`${API_BASE_URL}/expenses/summary`),
      ]);

      const customers = await custRes.json();
      const employees = await empRes.json();
      const services = await svcRes.json();
      const spares = await sprRes.json();
      const expenseData = await expRes.json();

      setData({
        customers: Array.isArray(customers) ? customers.length : 0,
        employees: employees?.employees?.length || 0,
        services: Array.isArray(services) ? services.length : 0,
        spares: Array.isArray(spares) ? spares.length : 0,
        expenses: expenseData.totalCount || 0,
      });
      setExpenseSummary({
        totalAmount: expenseData.totalAmount || 0,
        totalCount: expenseData.totalCount || 0,
        byCategory: expenseData.byCategory || [],
      });
    } catch (err) {
      console.error("Report fetch error:", err);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const cards = [
    { title: "Total Customers", value: data.customers, icon: Users, bg: "bg-[#EFF6FF]", text: "text-[#155DFC]" },
    { title: "Total Employees", value: data.employees, icon: UserCog, bg: "bg-[#F0FDF4]", text: "text-[#00A63E]" },
    { title: "Services", value: data.services, icon: Wrench, bg: "bg-[#FAF5FF]", text: "text-[#9810FA]" },
    { title: "Spare Parts", value: data.spares, icon: Box, bg: "bg-[#FFF7ED]", text: "text-[#F54900]" },
    { title: "Total Expenses", value: formatCurrency(expenseSummary.totalAmount), icon: DollarSign, bg: "bg-[#FEF2F2]", text: "text-[#DC2626]", subtitle: `${data.expenses} entries` },
  ];

  return (
    <div className="bg-white rounded-xl border p-6 overflow-y-auto h-[70vh]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">General Reports</h2>
          <p className="text-sm text-gray-500">
            Overview of all general module data
          </p>
        </div>
        <FileText size={20} className="text-gray-400" />
      </div>

      <div className="grid grid-cols-5 gap-4 mb-8">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
              <div key={i} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{card.title}</p>
                    <h3 className="text-2xl font-bold mt-1">{card.value}</h3>
                    {card.subtitle && <p className="text-xs text-gray-400 mt-0.5">{card.subtitle}</p>}
                  </div>
                  <Icon className={`${card.bg} ${card.text} w-10 h-10 p-2 rounded-lg`} />
                </div>
              </div>
          );
        })}
      </div>

      <div>
        <h3 className="text-base font-semibold mb-3">Quick Summary</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-[12px] font-[400] font-[Arial] text-[#6A7282] border-b">
              <th className="py-3 px-4">MODULE</th>
              <th className="py-3 px-4">TOTAL COUNT</th>
              <th className="py-3 px-4">TOTAL VALUE</th>
              <th className="py-3 px-4">DESCRIPTION</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b text-[#101828] text-sm hover:bg-gray-50">
              <td className="py-4 px-4 font-medium">Customers</td>
              <td className="py-4 px-4">{data.customers}</td>
              <td className="py-4 px-4 text-gray-400">—</td>
              <td className="py-4 px-4 text-gray-500">Client and customer database</td>
            </tr>
            <tr className="border-b text-[#101828] text-sm hover:bg-gray-50">
              <td className="py-4 px-4 font-medium">Employees</td>
              <td className="py-4 px-4">{data.employees}</td>
              <td className="py-4 px-4 text-gray-400">—</td>
              <td className="py-4 px-4 text-gray-500">Staff and employee records</td>
            </tr>
            <tr className="border-b text-[#101828] text-sm hover:bg-gray-50">
              <td className="py-4 px-4 font-medium">Services</td>
              <td className="py-4 px-4">{data.services}</td>
              <td className="py-4 px-4 text-gray-400">—</td>
              <td className="py-4 px-4 text-gray-500">Service categories and pricing</td>
            </tr>
            <tr className="border-b text-[#101828] text-sm hover:bg-gray-50">
              <td className="py-4 px-4 font-medium">Spare Parts</td>
              <td className="py-4 px-4">{data.spares}</td>
              <td className="py-4 px-4 text-gray-400">—</td>
              <td className="py-4 px-4 text-gray-500">Spare categories and inventory</td>
            </tr>
            <tr className="border-b text-[#101828] text-sm">
              <td className="py-4 px-4">
                <button
                  onClick={() => setExpenseOpen(!expenseOpen)}
                  className="flex items-center gap-1 font-medium text-sm"
                >
                  {expenseOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  Expenses
                </button>
              </td>
              <td className="py-4 px-4">{data.expenses}</td>
              <td className="py-4 px-4 font-medium">{formatCurrency(expenseSummary.totalAmount)}</td>
              <td className="py-4 px-4 text-gray-500">Daily operational expenses</td>
            </tr>
            {expenseOpen && expenseSummary.byCategory.map((cat, i) => (
              <tr key={i} className="text-xs text-[#101828] bg-gray-50/50">
                <td className="py-2 px-4 pl-10 text-gray-500">{cat.category}</td>
                <td className="py-2 px-4">{cat.count}</td>
                <td className="py-2 px-4">{formatCurrency(cat.total)}</td>
                <td className="py-2 px-4"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;