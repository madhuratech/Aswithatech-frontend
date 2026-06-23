import React from "react";
import {NavLink,Outlet} from "react-router-dom";

import {
  Users,
  UserCog,
  Settings,
  Wrench,
   Box,
   DollarSign,
   FileText,
} from "lucide-react";

const General = () =>{

   const Generalmenu = [
     {title:"Customer Master", path:"/general/customer",icon:Users},
     {title:"Service",path:"/general/services",icon:Wrench},
     {title:"Spare", path:"/general/spare",icon:Box},
     {title:"Expense Master", path:"/general/expense",icon:DollarSign},
     {title:"Employee Master", path:"/general/employee",icon:UserCog},
     {title:"Expense Report", path:"/general/expense-report", icon:FileText},
     {title:"System Settings", path:"/general/setting", icon:Settings}

   ]



    return(
      <div className="w-full min-h-screen ">
      <div className=" grid grid-cols-[260px_1fr] gap-6 p-6">
          <div className="bg-[#FFF] rounded-xl border border-[0.8px] border-[rgba(0, 0, 0, 0.10] p-5 py-[50px] w-[257.6px] h-[37s0px]">
              <ul className="flex flex-col gap-6 font-[Arial] text-[14px] align-item-center font-normal font-[400] ">
                 {Generalmenu.map((item,i) => {
                   const Icon = item.icon;
                   return(
                  <li key={i}>
                   <NavLink 
                   to={item.path} className={({isActive}) => `flex item-center gap-3 px-[3px] py-[3px] rounded-lg transaction
                      ${isActive ? "bg-[#ECEEF2] text-[#1447E6] border-l-4" : "hover:text-[#1447E6]"}`}>

                    <Icon size={18} />
                    <span>{item.title}</span>
                   </NavLink>
                   </li>
                   );
                 })}
              </ul>
         </div>
         {/*  */}
         {/* RIGHT CONTENT AREA */}
        <div >
       <Outlet />
       </div>
                
     </div>
    </div>
    )
}
export default General;