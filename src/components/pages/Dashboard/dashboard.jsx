import React from "react";
import Statcard from "../../cards/dashboardcard";


const Home = () =>{

    return(
           <div className="min-h-screen p-10">
             <div>
                 <h3 className="text-lg font-[Arial] text-[28px] text-[#101828]  font-[700]">Wellcome Back.. 👋</h3>
             </div>
              <div>
               <Statcard/>
               </div>
             </div>
    )
}
export default Home;