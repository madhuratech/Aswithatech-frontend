import React from "react";
import { FileText, Clock, IndianRupee, Users } from "lucide-react";

const Reports = () => {
  const Reportcard = ({ title, value, icons }) => (
    <div className="rounded-xl border border-black/10 bg-white text-black p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-gray-900 leading-5 group-hover:text-blue-600 transition-colors">
            {title}
          </p>
          <h3 className="text-2xl font-semibold leading-7 mt-2">
            {value}
          </h3>
        </div>

        <div className="text-2xl text-gray-400">
          {icons}
        </div>

      </div>
    </div>
  );

  const cards = [
    { title: "Total Jobs", value: "", icons: <FileText className="bg-[#EFF6FF] text-[#155DFC] w-[40px] h-[40px] px-2 rounded-lg" /> },
    { title: "Active Customers", value: "", icons: <Users className="bg-[#F0FDF4] text-[#00A63E] w-[40px] h-[40px] px-2 rounded-lg " /> },
    { title: "Total Revenue", value: "", icons: <IndianRupee className="bg-[#FAF5FF] text-[#9810FA] w-[40px] h-[40px] px-2 rounded-lg" /> },
    { title: "Avg Turnaround", value: "", icons: <Clock className="bg-[#FFF7ED] text-[#F54900] w-[40px] h-[40px] px-2 rounded-lg " /> },

  ];


  return (
    <div className="min-h-screen p-10">
      <div className="mb-10">
        <h6 className="text-3xl font-bold text-gray-900 tracking-tight">Reports & Analytics</h6>
      </div>

      {/*Cards */}
      <div className="grid grid-cols-4 gap-6">
        {cards.map((Item, i) =>
          <Reportcard
            key={i}
            title={Item.title}
            value={Item.value}
            icons={Item.icons}
          />
        )}
      </div>
    </div>
  )

}

export default Reports;
