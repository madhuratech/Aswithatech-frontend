import React,{useEffect,useState} from "react";
import { Plus, Pencil, Eye, Trash2 } from "lucide-react";
import { successToast, errorToast} from "../../ui/nottifications";
import toast from "react-hot-toast";
import AddNewCustomerModal from "../../forms/general/addnewclient";
import Addpassword from "../../forms/general/addeditpassword";  
import ViewCustomer from "../../forms/general/ViewCustomer";

const Customer = () =>{
     const [customers, setCustomers] = useState([]);
     const[editingCustomer,setEditingCustomer] = useState(null)
     const[open,setopen] = useState(false)
    const [verifyOpen,setVerifyOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [viewCustomer, setViewCustomer] = useState(null);
    const [viewCustomerIdString, setViewCustomerIdString] = useState("");


  // Fetch all data
  const fetchCustomers = async () => {
  const res = await fetch("http://localhost:3000/api/customers/all");
  const data = await res.json();
  setCustomers(data);
};

useEffect(() => {
  fetchCustomers();
}, []);


// Forms
const editCustomer = (customer) => {
  setEditingCustomer(customer); 
  setVerifyOpen(true);              
};

const handleViewClick = (customer, index) => {
  setViewCustomer(customer);
  setViewCustomerIdString(`CUST${String(index + 1).padStart(3, "0")}`);
  setViewOpen(true);
};

  /* DELETE */
  const deleteCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?"))return;

    const deleteCustomer = customers.find((c) => c.id === id);
    setCustomers(customers.filter((c)=> c.id !== id));

    const toastId = toast(
     (t) =>(
      <div className="flex items-center gap-3">
        <span>Customer Deleted</span>
         <button className="text-blue-500 text-sm underline" onClick={()=>{
            setCustomers((prev) => [...prev, deleteCustomer]);
            toast.dismiss(t.id);
            successToast("Delete undone")}}>
           Undo
         </button>
      </div>
     ),
     {duration:5000}
 );
 
  try{
    const res = await fetch(
      `http://localhost:3000/api/customers/delete/${id}`,
      { method: "DELETE" }
    );
    if(!res.ok) throw new Error("Delete Failed");
  } catch (err){
    toast.dismiss(toastId);
    setCustomers((prev) => [...prev, deleteCustomer]);
    errorToast("Failed to Delete Customers");
  }
};

//Password;




    return(

       <div className="bg-white rounded-xl border p-6 overflow-y-auto h-[70vh]">

          {/* Header */}
           
           <div className="flex justify-between items-center mb-6 ">
                <div>
              <h2 className="text-lg font-semibold">Customer Master</h2>
              <p className="text-sm text-gray-500">
                Manage customer database
              </p>
            </div>

            {/*Add buttons*/}
                
            <button
              onClick={() => setopen(true)}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg"
            >
              <Plus size={16} />
              Add Customer
            </button>
           </div>
            <div>
          {open && (
         <AddNewCustomerModal key={editingCustomer ? editingCustomer.id : "add"}
          customer={editingCustomer}
          onClose={() => {
          setopen(false);
         setEditingCustomer(null);}}refresh={fetchCustomers}/>)}
  
         {verifyOpen && (
          <Addpassword
           onClose={() => setVerifyOpen(false)}
            onSuccess={() => {
            setVerifyOpen(false);
            setopen(true); }}/>)}

         {viewOpen && viewCustomer && (
          <ViewCustomer
            onClose={() => {
              setViewOpen(false);
              setViewCustomer(null);
              setViewCustomerIdString("");
            }}
            customer={viewCustomer}
            customerIdString={viewCustomerIdString}
          />
         )}

            </div>
          {/* Tables */}
               <div className="overflow-y-auto">
                    <table className="w-full border-collapse">
                         <thead>
                           <tr className=" text-left text-[12px] font-[400]  font-[Arial] text-[#6A7282] border-b">
                              <th className="py-3 px-4">ID</th>
                              <th className="py-3 px-4">NAME</th>
                               <th className="py-3 px-4">PHONE</th>
                                <th className="py-3 px-4">TYPE</th>
                                 <th className="py-3 px-4">BALANCE</th>
                                <th className="py-3 px-8 ">ACTIONS</th>
                           </tr>
                        </thead>

                           {/* body */}
                            <tbody>
  {customers.map((c, index) => (
    <tr key={c.id} className="border-b text-[#101828] text-sm hover:bg-gray-50">

      <td className="py-4 px-4">
        CUST{String(index + 1).padStart(3, "0")}
      </td>

      <td className="py-4 px-4 font-medium">
        {c.customer_name}
      </td>

      <td className="py-4 px-4">
        {c.phone}
      </td>

      <td className="py-4 px-4">
        <span
          className={`px-3 py-1 rounded-full text-xs ${
            c.customer_type === "new"
              ? "bg-gray-200 text-gray-700"
              : "bg-black text-white"
          }`}
        >
          {c.customer_type === "new" ? "New" : "Existing"}
        </span>
      </td>

      <td className="py-4 px-4">
        ₹0
      </td>

      {/* ACTIONS */}
      <td className="py-4 px-4">
        <div className="flex justify-center gap-3 mr-7">
          <Pencil
            size={16}
            className="cursor-pointer text-gray-600 hover:text-black"
            onClick={() => editCustomer(c)}
          />
          <Eye
            size={16}
            className="cursor-pointer text-gray-600 hover:text-black"
            onClick={() => handleViewClick(c, index)}
          />
          <Trash2
            size={16}
            className="cursor-pointer text-red-500"
            onClick={() => deleteCustomer(c.id)}
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
};
export default Customer
