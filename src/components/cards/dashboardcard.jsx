import React from "react";
import {TrendingUp,Clock,CheckCircle2,Package,PackageOpen,ArrowLeftRight,
AlertCircle,FileText,IndianRupee,Plus,Send,Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Statcard = () =>{
  const navigate = useNavigate();
 const Card = ({ title, value, icons, onClick }) => (
    <div onClick={onClick} className="rounded-xl border border-black/10 bg-white text-black p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
      
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
    { title: "Jobs", value: 0,icons:<TrendingUp className="bg-[#EFF6FF] text-[#155DFC] w-[40px] h-[40px] px-2 rounded-lg "/> },
    { title: "Pending Jobs", value: 4,icons:<Clock className="bg-[#FFF7ED] text-[#F54900] w-[40px] h-[40px] px-2 rounded-lg "/>},
    { title: "Completed Jobs", value: 12,icons:<CheckCircle2 className="bg-[#F0FDF4] text-[#00A63E] w-[40px] h-[40px] px-2 rounded-lg "/> },
    { title: "Brand PCBS",  value: 8,icons:<Package className="bg-[#FAF5FF] text-[#9810FA] w-[40px] h-[40px] px-2 rounded-lg "/>},
    { title: "Non-Brand PCBS", value: 6,icons:<PackageOpen className="bg-[#EEF2FF] text-[#4F39F6] w-[40px] h-[40px] px-2 rounded-lg "/> },
    { title: "Standby Issued", value: 3,icons:<ArrowLeftRight className="bg-[#ECFEFF] text-[#0092B8] w-[40px] h-[40px] px-2 rounded-lg "/> },
    { title: "Overdue", value: 5,icons:<AlertCircle className="bg-[#FEF2F2] text-[#E7000B] w-[40px] h-[40px] px-2 rounded-lg "/> },
    { title: "Pending Reports", onClick: () => navigate("/pending"), value: 120,icons:<FileText className="bg-[#FEFCE8] text-[#D08700] w-[40px] h-[40px] px-2 rounded-lg "/> },
    { title: "Balance Payment", value: 9,icons:<IndianRupee className="bg-[#FFF1F2] text-[#EC003F] w-[40px] h-[40px] px-2 rounded-lg "/> },
  ];
    return(
    <div className="min-h-screen">
      <div className="grid grid-cols-3 w-[95%] px-[15px] ml-7 gap-7 mt-10">
      {cards.map((card, index) => (
        <Card
          key={index}
          title={card.title}
          value={card.value}
          icons={card.icons}
          onClick={card.onClick}
        />
      ))}
    </div>
      {/*  */}
        <div className="grid grid-cols-2 gap-6 p-10">
     <div className="rounded-xl border border-black/10 bg-white p-7 w-[320px] h-[280px]">  
    <h5 className="text-sm font-semibold text-gray-700">
      Quick Actions
    </h5>

    <div className="mt-6 flex flex-col gap-3 font-[Times-New-Roman]">

      <button className="flex items-center gap-2 bg-[#155DFC] w-[240px] h-[35px] px-3 text-white rounded-lg text-[15px]">
        <Plus size={18} />
        New Inward Entry
      </button>

      <button className="flex items-center gap-2 bg-[#00A63E] w-[240px] h-[35px] px-3 text-white rounded-lg text-[15px]">
        <Send  size={18} />
        Issue Standby PCB
      </button>

      <button className="flex items-center gap-2 bg-[#9810FA] w-[240px] h-[35px] px-3 text-white rounded-lg text-[15px]">
        <FileText size={18} />
        Create Service Invoice
      </button>

      <button className="flex items-center gap-2 bg-[#4F39F6] w-[240px] h-[35px] px-3 text-white rounded-lg text-[15px]">
        <Search  size={18} />
       View Job Details
      </button>

    </div>
  </div>
   {/*  */}
   <div className="rounded-xl border border-black/10 bg-white p-4 relative right-[65px] w-[110%]">
           <div>
             <h5>Alert Notifications</h5>
           </div>
   </div>
</div>

    </div>
    )
}
export default Statcard;