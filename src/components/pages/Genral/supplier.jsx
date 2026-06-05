import React,{useState} from "react";
import PCBMASTER from "../../forms/general/spare";
import {Plus} from "lucide-react";

const PCB = () =>{

 const [open,setOpen] = useState(false);

 return(
   <div className="bg-white rounded-xl border p-6 overflow-y-auto h-[70vh]">

    <div className="flex justify-between mb-5">
      <h2 className="text-lg font-semibold">PCB Master</h2>

      <button
       onClick={()=>setOpen(true)}
       className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg"
      >
       <Plus size={16}/>
       Add PCB
      </button>
    </div>

      {open && <PCBMASTER onClose={()=>setOpen(false)} />}

   </div>
 )
}

export default PCB;
