import React, { useEffect, useState } from "react";
import { useScrollLock } from "../../hooks/useScrollLock";
import { X } from "lucide-react";
import { successToast, errorToast, loadingToast } from "../ui/nottifications";
import toast from "react-hot-toast";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";



const AddNewCustomerModal = ({ onClose, customer, refresh }) => {
  const {
    showPasswordModal,
    requirePassword,
    handlePasswordSuccess,
    handlePasswordCancel,
  } = usePasswordProtection();
  const [customerType, selectCustomerType] = useState("new");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDropdown , setDropdown]= useState(false);



  // Background overflow lock
  useScrollLock(true);


  // Forms
  const [form, setForm] = useState({
      customer_name: "",
      phone: "",
      email: "",
      address: "",
      gst_number: "",
      state: "",
      pincode: "",
      contact_person: "",
      customer_type: "new",
  });



  // Search and Select Customer;

  const selectCustomer = (c) => {
  setSelectedCustomer(c);
  selectCustomerType("existing");

  setForm(prev => ({
    ...prev,
    customer_name: c.customer_name || "",
    phone: c.phone || "",
    email: c.email || "",
    address: c.address || "",
    gst_number: c.gst_number || "",
    state: c.state || "",
    pincode: c.pincode || "",
    contact_person: c.contact_person || "",
    customer_type: "existing",
  }));

  setSearchTerm(c.customer_name);
  setFilteredCustomers([]);
  setDropdown(false);
};




  // Save Customer

  const handleSave = (e) => {
    e.preventDefault();
    saveCustomer(e);
  };

  const saveCustomer = async (e) => {
  e.preventDefault();

  const toastId = loadingToast("Saving customer...");

  try {
    const url = customer
      ? `http://localhost:3000/api/customers/update/${customer.id}`
      : "http://localhost:3000/api/customers/new";

    const method = customer ? "PUT" : "POST";

    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === "" ? null : v])
    );

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      console.log("BACKEND ERROR:", error);
      throw new Error(error.message);
    }

    toast.dismiss(toastId);
    successToast("Customer saved successfully");

    refresh();
    onClose();

  } catch (err) {
    toast.dismiss(toastId);
    errorToast(err.message);
  }
};



  // / EDIT MODE → prefill

useEffect(() => {
  if (customer) {
    
    const type = customer.customer_type || "existing";

    selectCustomerType(type);

    setForm({
      customer_name: customer.customer_name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      gst_number: customer.gst_number || "",
      state: customer.state || "",
      pincode: customer.pincode || "",
      contact_person: customer.contact_person || "",
      customer_type: type, 
    });

    setSelectedCustomer(customer);

  } else {
    selectCustomerType("new"); 

    setForm({
      customer_name: "",
      phone: "",
      email: "",
      address: "",
      gst_number: "",
      state: "",
      pincode: "",
      contact_person: "",
      customer_type: "new",
    });

    setSelectedCustomer(null);
    setSearchTerm("");
  }
}, [customer]);


  // FetchSearch;

  useEffect(() =>{
    if(customerType !== "existing") return;
    const delay = setTimeout(async () =>{
      let url = "";

      if (searchTerm.trim() === "") {
  url = "http://localhost:3000/api/customers/all";
} else {
  url = `http://localhost:3000/api/customers/search?q=${searchTerm}`;
}
      const res = await fetch(url);
      const data = await res.json();

      const sorted = data.sort((a,b) =>{
        const aMatch = a.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const bMatch = b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());  
        return bMatch - aMatch;
      });
      setFilteredCustomers(sorted);
    },300);

    return () => clearTimeout(delay);

  },[searchTerm, customerType])


//  gstnnumber,
 const Gst_State_Code = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman and Diu",  
  "26": "Dadra and Nagar Haveli",
  "27": "Maharashtra",
  "28": "Andhra Pradesh",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu", 
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh (New)"
 };

 //Handle Click;

 useEffect(() => {
  const handleClickOutside = (e) => {
    if (!e.target.closest('.relative')) {
      setDropdown(false);
    }
  };

  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
}); 




  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">

      {/* Modal Box */}
      <div className="bg-white w-[650px] mt-[220px] ml-20 rounded-xl shadow-lg p-6 flex flex-col mb-[80px]">

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">
              {customerType === "new"
                ? "Add New Customer"
                : "Select Existing Customer"}
            </h2>
            <p className="text-sm text-gray-500">
              {customerType === "existing"
                ? "Enter customer details below."
                : "Search and select a customer."}
            </p>
          </div>
          <button onClick={onClose}>
            <X className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* Customer Type */}
          <div>
            <label className="text-sm font-medium">Customer Type</label>
            <select value={customerType} onChange={(e) => selectCustomerType(e.target.value)} className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none">
              <option value="new">New Customer</option>
              <option value="existing">Existing Customer</option>
            </select>
          </div>

          {/* Existing Client */}
          {customerType === "existing" && (
            <div className="p-6 flex flex-col space-y-4 ">
              <div className="relative right-6">
                <label className="text-sm font-medium">Search Customer</label>
                <input
                  type="text"
                  placeholder="Search by name, phone, or GST..."
                  onFocus={() => {setDropdown(true); setSelectedCustomer("");}}
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setSelectedCustomer(null) }}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1  w-[600px]"
                />
              </div>


              {/* Search Results */}

             {showDropdown && (
  <div className="border rounded-lg max-h-52 overflow-y-auto bg-white shadow">
    
    {filteredCustomers.length > 0 ? (
      filteredCustomers.map((c) => (
        <div
          key={c.id}
          onClick={() => selectCustomer(c)}
          className="p-3 cursor-pointer hover:bg-gray-100 border-b"
        >
          <p className="font-medium">{c.customer_name}</p>
          <p className="text-xs text-gray-500">
            {c.phone} • {c.gst_number || "No GST"}
          </p>
        </div>
      ))
    ) : (
      <div className="p-3 text-sm text-gray-500 text-center">
        No customers found
      </div>
    )}
  </div>
)}


              {/* Buttons */}

              <div className="flex justify-end gap-3 relative top-5">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border text-sm"
                >
                  Cancel
                </button>

                <button type="submit"
                  disabled={!selectedCustomer}
                  onClick={() => { selectCustomerType("new"); }}
                  className="px-5 py-2 rounded-lg bg-black text-white text-sm">
                  Continue
                </button>
              </div>
            </div>
          )}


          {/* Name + Phone */}
          {customerType === "new" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    placeholder="Enter customer name"
                    className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 XXXXX XXXXX"
                    className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="customer@example.com"
                  className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none"
                />
              </div>

              {/* Contact Person */}
              <div>
                <label className="text-sm font-medium">Contact Person</label>
                <input
                  type="text"
                  value={form.contact_person}
                  onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                  placeholder="Enter contact person Number"
                  className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none"
                />
              </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-sm font-medium">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Enter full address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none resize-none"
                />
              </div>

              {/* State & pincode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">State</label>
                  <input
                    type="text"     
                    value={form.state}
                    placeholder="Auto-detected from GSTIN"
                    readOnly
                    className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none"
                  />
                </div>
                {/*  */}
                 <div>
                  <label className="text-sm font-medium">Pincode</label>
                  <input
                    type="text"
                    value={form.pincode}
                    onChange={(e) => setForm({...form, pincode: e.target.value})} 
                    className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              {/* GST */}
              <div>
                <label className="text-sm font-medium">GST Number</label>
                <input
                  type="text"
                  placeholder="22AAAAA0000A1Z5"
                  value={form.gst_number}
                  onChange={(e) =>{ 
                    const gst = e.target.value.toUpperCase();
                     let detectedState = ""; if(gst.length >= 2){  const stateCode = gst.substring(0,2);
                      detectedState = Gst_State_Code[stateCode] || "";} 
                      setForm(prev =>({...prev, gst_number: gst, state: detectedState}))}}
                  className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="relative p-4 top-4 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border text-sm"
                >
                  Cancel
                </button>

                <button type="submit" className="px-5 py-2 rounded-lg bg-black text-white text-sm">
                  Save Customer
                </button>
              </div>
            </>
          )}
        </form>

        {/* Footer */}

      </div>
      {showPasswordModal && (
        <Addpassword onSuccess={handlePasswordSuccess} onClose={handlePasswordCancel} />
      )}
    </div>

  );
};

export default AddNewCustomerModal;
