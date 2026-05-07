import React,{useState} from "react";
import {X} from "lucide-react";
import { useScrollLock } from "../../hooks/useScrollLock";
import { toast } from "react-hot-toast";
import { successToast, errorToast, loadingToast } from "../ui/nottifications";


const AddEmployee = ({ onClose ,refreshEmployees,employee }) => {
     
    const[open,setOpen] = React.useState(false);
    const [category,setCategory] = React.useState("");

 // Background overflow lock
      useScrollLock(true);

//  Form submission handler
  const [formData, setFormData] = useState({
    employee_name: "",
    designation: "",
    department: "",
    contact: "",
    address: "",
    pincode: "",
    identification: "",
    pannumber: "",
    doucment:""
  });

const saveCustomer = async (e) => {
  e.preventDefault();

  const toastId = loadingToast("Saving employee...");

  try {
    const url = employee
      ? `http://localhost:3000/api/employees/edit/${employee.id}`
      : "http://localhost:3000/api/employees/new";

    const method = employee ? "PUT" : "POST";

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'doucment') {
        if (formData[key] instanceof File) {
          data.append(key, formData[key]);
        }
      } else {
        data.append(key, formData[key]);
      }
    });

    const res = await fetch(url, {
      method,
      body: data, 
    });

    if (!res.ok) {
      const error = await res.json();
      console.log("BACKEND ERROR:", error);
      throw new Error(error.message);
    }

    toast.dismiss(toastId);
    successToast("Employee saved successfully");

    refreshEmployees();
    onClose();

  } catch (err) {
    toast.dismiss(toastId);
    errorToast(err.message);
  }
};

//prefill employee data;

React.useEffect(() => {
  if(employee) {
    setFormData({
      employee_name: employee.employee_name || "",
      designation: employee.designation || "",
      department: employee.department || "",
      contact: employee.contact || "",
      address: employee.address || "",
      pincode: employee.pincode || "",
      identification: employee.identification || "",
      pannumber: employee.pannumber || "",
      doucment: null // Don't prefill file input with string/buffer
    });

    setCategory(employee.department || ""); 
  }
}, [employee]);



// handle input change
const handleChange = (e) => {
  setFormData(prev => ({
    ...prev,
    [e.target.name]: e.target.value
  }));
};


     return(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
         {/* model */}
       <div className="bg-white w-[650px] mt-[450px] ml-20 rounded-xl shadow-lg p-6 flex flex-col mb-[80px]">
             <div className="flex items-start justify-between mb-4">
             <div>
                <h2 className="text-lg font-semibold">Add New Employee</h2>
             </div>

             {/* onclose */}
                <div>
                <button onClick={onClose}>
                 <X className="text-gray-400 hover:text-gray-600" />
                </button>
                </div>
             </div>

                {/* form */}

                <form onSubmit={saveCustomer}>
                    <div className="space-y-6">
                         <div>
                            <label className="text-sm font-medium" htmlFor="employeeId">Employee ID</label>
                            <input type="text" name="employeeID" 
                            value={formData.employeeID}
                            onChange={handleChange}
                            disabled
                            className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer" placeholder="Eg: EMP001" />
                         </div>

                         {/*Name and designation*/}
                         <div className="grid grid-cols-2 gap-7">
                           <div>
                             <label className="text-sm font-medium" htmlFor="employeeName">Employee Name</label>
                             <input type="text" name="employee_name" 
                              value={formData.employee_name}
                              onChange={handleChange}
                             className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer" 
                             placeholder="Eg: John Doe" />
                           </div>

                           {/*  */}

                           <div>
                                <label className="text-sm font-medium" htmlFor="designation">Designation</label>
                               <input type="text" id="designation"
                               name="designation" 
                               value={formData.designation}
                               onChange={handleChange}
                               className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                               placeholder="Eg: Software Engineer" />
                           </div>

                        </div>

                           {/* Information */}
                            <div className="grid grid-cols-2 gap-7">

                              <div className="">
                                   <label className="text-sm font-medium" htmlFor="contact">Contact</label>
                                   <input type="text" name="contact"
                                    value={formData.contact}
                                    onChange={handleChange}
                                    className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                                    placeholder="Eg: 9876543210" />
                              </div>

                              {/* Department */}
                              <div className="relative">
                                <label className="text-sm font-medium" htmlFor="department">Department</label>
                                <input 
                               value={category || formData.department}
                                 onClick={() => {setOpen(true)}} type="text" name="department" className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                                placeholder="Eg: IT" />
                              
                               {open  && ( <div className="absolute top-full left-0 mt-1 w-full bg-white shadow p-3 rounded-lg border z-10">
                                  <ul className="leading-8 cursor-pointer">
                                    <li onClick={() => {setCategory("Sales");setFormData(prev => ({...prev,
                                     department: "Sales"}));setOpen(false);}} className="hover:bg-gray-100 px-2 rounded">Sales</li>
                                    <li onClick={() =>{setCategory("Services"); setFormData(prev => ({...prev, department: "Services"})); setOpen(false)}} className="hover:bg-gray-100 px-2 rounded">Services</li>                                    
                                   </ul>
                                  </div>
                               )}
                              </div>
                             </div> 

                              {/* Address */}

                                <div>
                                <label className="text-sm font-medium" htmlFor="address">Address</label>
                                <input
                                 value={formData.address}
                                 onChange={handleChange}
                                 type="text" name="address" className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                                 placeholder="Eg: 123 Main Street, City, State, ZIP Code" />
                             </div>

                             {/* pincode and indentification*/}
                                <div className="grid grid-cols-2 gap-7">
                                    <div>
                                        <label className="text-sm font-medium" htmlFor="pincode">Pincode</label>
                                        <input 
                                         value={formData.pincode}
                                         onChange={handleChange}
                                         type="text" name="pincode" className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                                         placeholder="Eg: 123456" />
                                   </div>

                                   {/*  */}

                                      <div>
                                        <label className="text-sm font-medium" htmlFor="identification">Identification</label>
                                        <input 
                                         value={formData.identification}
                                         onChange={handleChange}
                                         type="text" name="identification" className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                                         placeholder="Eg: Aadhar Number" />
                                    </div>

                                    {/* Pan Number */}

                                    
                               </div>   
                               {/* Pan Number */}
                               <div>
                                        <label className="text-sm font-medium" htmlFor="identification">Pan Number</label>
                                        <input 
                                         value={formData.pannumber}
                                         onChange={handleChange}
                                         type="text" name="pannumber" className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                                         placeholder="Eg: Aadhar Number" />
                                    </div>
                             
                                      {/* Doucment */}
                                    <div>
                                        <label className="text-sm font-medium" htmlFor="identification">Doucments</label>
                                        <input 
                                          onChange={(e) => {
                                            setFormData(prev => ({
                                              ...prev,
                                              doucment: e.target.files[0]
                                            }));
                                          }}
                                         type="file" name="doucment" className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                                         placeholder="Eg: Aadhar Number" />
                                         {employee && employee.doucment && !formData.doucment && (
                                            <div className="mt-1 flex items-center gap-1 text-[11px] text-blue-600 cursor-pointer hover:underline" 
                                                 onClick={() => {
                                                     const uint8Array = new Uint8Array(employee.doucment.data);
                                                     const blob = new Blob([uint8Array]);
                                                     const url = URL.createObjectURL(blob);
                                                     window.open(url, "_blank");
                                                 }}>
                                                View current document
                                            </div>
                                         )}
                                    </div>

                                {/*buttons  */}

                                <div className="relative p-5 top-4 flex justify-end gap-3">
                                    <button  onClick={onClose}className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
                                    <button className="px-5 py-2 rounded-lg bg-black text-white text-sm">Submit</button>
                                </div>
                    </div>
                </form>
       </div>
     </div>
     );

}
export default AddEmployee;