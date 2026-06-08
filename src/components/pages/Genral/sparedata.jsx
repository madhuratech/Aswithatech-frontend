import React,{useEffect, useState} from "react";
import SpareModel from "../../forms/spare";
import {Plus,Trash2,SquarePen} from "lucide-react";
import {  errorToast} from "../../ui/nottifications";
import Addpassword from "../../forms/addeditpassword";
// import toast from "react-hot-toast";

const Servicedata = () =>{

 const [open,setOpen] = useState(false);
 const [spares , setspares] = useState([]);
 const [search, setSearch] = useState("");
 const [verifyOpen,setVerifyOpen] = useState(false);
const [editOpen,setEditOpen] = useState(false);
const [selectedSpare,setSelectedSpare] = useState(null);
 
 const Api_urls = "http://localhost:3000/api/Sparemodels";

//  Fetch Data;

const Fetchspare = async () => {
  try {
    const res = await fetch(`${Api_urls}/all`);
    const data = await res.json();

    console.log("Fetched:", data); 

    setspares(data);
  } catch (error) {
    errorToast("Error fetching spares");
    console.error(error);
  }
};

useEffect(()=>{
    Fetchspare();
  },[]);


  

const filterspares = spares.filter((s)=> 
  (s.spare_name && s.spare_name.toLowerCase().includes(search.toLowerCase())) || 
  (s.hsn_number && String(s.hsn_number).includes(search))
);

// delete;
const handleDelete = async (id) => {
  try {
    const res = await fetch(`${Api_urls}/delete/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      // Remove the deleted spare from the local state
      setspares(spares.filter((s) => s.id !== id));
      // toast.success("Spare deleted successfully");
    } else {
      errorToast("Failed to delete spare");
    }
  } catch (error) {
    errorToast("Error deleting spare");
    console.error(error);
  }
};

// Pasword
const handleditclick = (spare) => {
  setSelectedSpare(spare);
  setVerifyOpen(true);
};


 return(
   <div className="bg-white rounded-xl border p-6 overflow-y-auto h-[70vh]">

    <div className="flex justify-between mb-5">
       <div>
      <h2 className="text-lg font-semibold">Spare Master</h2>
       <p className="text-gray-500 text-sm">
            Define Spare categories and pricing
        </p>
        </div>
       

       <div className="flex items-center gap-4">
         <div>
           <input type="text" 
           className=" border border-gray-300 rounded-md px-4 py-2 w-full outline-none focus:border-[#98A2B3]     border border-[#D0D5DD]  transition-all duration-200 bg-[#F2F4F7]" placeholder="Search spares..."
           value={search}
           onChange={(e)=>setSearch(e.target.value)}/>
          </div>

      <button
       onClick={()=>setOpen(true)}
       className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg"
      >
       <Plus size={16}/>
       Add Spares
      </button>
     </div>

    </div>


      <div> 
        {open && (<SpareModel onClose={() => {setOpen(false); }}
         refreshSpare={Fetchspare}/> )}
       
       
        {verifyOpen && (
          <Addpassword
           onClose={() => setVerifyOpen(false)}
            onSuccess={() => {
            setVerifyOpen(false);
            setEditOpen(true); }}/>)}
         
         {/*Editopen*/}
         {editOpen && selectedSpare && (
        <SpareModel
        onClose={() => setEditOpen(false)}
        spare={selectedSpare}
        editMode={true} refreshSpare={Fetchspare}
  />
)}
        </div>

        {/* table */}

         <div className="overflow-y-auto">
          <table className="w-full text-left border-collapseml-6">
            <thead >
              <tr className="text-left text-[12px] font-[400]  font-[Arial] text-[#6A7282] border-b">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">SPARE NAME</th>
                <th className="py-3 px-4">HSN CODE</th>
                <th className="py-3 px-4">ACTIONS</th>
              </tr>
            </thead>

            {/* body */}

            <tbody>
              {filterspares.map((s,item) => (
              <tr key={s.id} className="border-b text-[#101828] text-sm hover:bg-gray-50">
                <td className="p-2"> #SPR{String(item + 1).padStart(3, "0")}</td>
                <td className="py-4 px-4 font-medium">{s.spare_name}</td>
                <td className="py-4 px-4">{s.hsn_number}</td>
                <td className="py-4 px-4 text-center">
        <div className="flex gap-4">
          <SquarePen
            size={16}
            className="cursor-pointer text-gray-600 hover:text-black "
            onClick={() => handleditclick(s)}
          />  
          <Trash2
            size={16}
            className="cursor-pointer text-red-500"
            onClick={() => handleDelete(s.id)}
          />
        </div>
      </td>
       </tr>
              ))}
            </tbody>
          </table>
         </div>


   </div>
 )
}

export default Servicedata;
