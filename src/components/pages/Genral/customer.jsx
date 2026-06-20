import API_BASE_URL from "../../../config/api";
import React,{useEffect,useState} from "react";
import{Plus,
  Pencil,
  Trash2} from "lucide-react";
  import { successToast, errorToast} from "../../ui/nottifications";
  import toast from "react-hot-toast";
import AddNewCustomerModal from "../../forms/addnewclient";
import Addpassword from "../../forms/addeditpassword";  
const Customer = () =>{
     const [customers, setCustomers] = useState([]);
     const[editingCustomer,setEditingCustomer] = useState(null)
     const[open,setopen] = useState(false)
    const [verifyOpen,setVerifyOpen] = useState(false);


  // Fetch all data
  const fetchCustomers = async () => {
  const res = await fetch(`${API_BASE_URL}/customers/all`);
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
      `${API_BASE_URL}/customers/delete/${id}`,
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

            </div>
          {/* Tables */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed text-sm">
              <colgroup>
                <col className="w-[10%]" />
                <col className="w-[18%]" />
                <col className="w-[13%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[27%]" />
                <col className="w-[10%]" />
              </colgroup>

              <thead>
                <tr className="text-[11px] font-medium text-[#6A7282] border-b bg-gray-50">
                  <th className="py-3 px-4 text-left">ID</th>
                  <th className="py-3 px-4 text-left">NAME</th>
                  <th className="py-3 px-4 text-left">PHONE</th>
                  <th className="py-3 px-4 text-left">TYPE</th>
                  <th className="py-3 px-4 text-right">BALANCE</th>
                  <th className="py-3 px-4 text-left">ADDRESS</th>
                  <th className="py-3 px-4 text-center">ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((c, index) => (
                  <tr key={c.id} className="border-b text-[#101828] hover:bg-gray-50 align-middle">

                    <td className="py-4 px-4 text-gray-500 text-xs">
                      CUST{String(index + 1).padStart(3, "0")}
                    </td>

                    <td className="py-4 px-4 font-medium break-words">
                      {c.customer_name}
                    </td>

                    <td className="py-4 px-4 text-gray-600">
                      {c.phone}
                    </td>

                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        c.customer_type === "new"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-black text-white"
                      }`}>
                        {c.customer_type === "new" ? "New" : "Existing"}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <span className={Number(c.balance) > 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                        ₹{Number(c.balance || 0).toLocaleString("en-IN")}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-gray-600 break-words whitespace-normal leading-snug">
                      {c.address}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-3">
                        <Pencil
                          size={15}
                          className="cursor-pointer text-gray-500 hover:text-black"
                          onClick={() => editCustomer(c)}
                        />
                        <Trash2
                          size={15}
                          className="cursor-pointer text-red-400 hover:text-red-600"
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
