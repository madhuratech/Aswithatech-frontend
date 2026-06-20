import { useState,useEffect, useRef } from 'react';
import React from "react";
import { successToast,errorToast } from "../ui/nottifications";
import { X } from "lucide-react";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import API_BASE_URL from "../../config/api";

const Spare = ({onClose , refreshSpare,editMode,service }) => {
  const {
    showPasswordModal,
    handlePasswordSuccess,
    handlePasswordCancel,
  } = usePasswordProtection();
 
  const [search, setSearch] = useState("");
  const modalRef = useRef(null);
  const searchDropdownRef = useRef(null);

  useOutsideClick([
    { ref: modalRef, onClose },
    { ref: searchDropdownRef, onClose: () => setShowDropdown(false) }
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  const[result,setResult] = useState([]);
  const [servicename, setserviceName] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [hsn, setHsn] = useState(998314); 
  

  const Api_urls = `${API_BASE_URL}/Services`;


 useEffect(() => {
  if (editMode && service) {
    setserviceName(service.service_name || ""); 
    setHsn(service.hsn_number || 998314);
  }
}, [service, editMode]);


const Sparesearch = async (value = "") => {
  setSearch(value);

  try {
    let url;

    if (!value) {
      url = `${Api_urls}/all`; // 👈 SHOW ALL DATA
    } else {
      url = `${Api_urls}/search/${encodeURIComponent(value)}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    console.log("DATA:", data); 

    setResult(data);
    refreshSpare();

    if (data.length > 0) {
      setserviceName(data[0].service_name);
      setHsn(data[0].hsn_number || 998314);
    }

  } catch (error) {
    console.log("Error fetching search results:", error);
  }
};
  // Search Dropdown;

  const Spareselect = (selectedSpare) => {
  setserviceName(selectedSpare.service_name);
  setHsn(selectedSpare.hsn_number || 998314);
  setSearch(selectedSpare.service_name);
  setResult([]);
  setShowDropdown(false);
};


// Spare Save;
const handleSave = (e) => {
  e.preventDefault();
  Savespare(e);
};

const Savespare = async (e) => {
  e.preventDefault();

  if (!servicename.trim()) {
    errorToast("Service name is required");
    return;
  }

  try {
    let url;
    let method;

    if (editMode) {
      url = `${Api_urls}/update/${service.id}`;
      method = "PUT";
    } else {
      url = `${Api_urls}/new`;
      method = "POST";
    }

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_name: servicename,
        hsn_number: hsn === "" ? null : hsn,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed");
    }

    successToast(editMode ? "Updated successfully" : "Added successfully");

    refreshSpare?.();
    onClose();

  } catch (error) {
    errorToast(error.message);
  }
};


  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
          <div ref={modalRef} className="bg-white w-[500px] mt-[150px]  ml-20 rounded-xl shadow-lg p-6 flex flex-col mb-[80px]">
              <div className="flex items-center justify-between mb-4">
                 <div>
                   <h2 className="text-lg font-semibold mb-1">Add New Service</h2>
                 </div>
                  
              <button
               onClick={onClose}
               className="text-gray-500 hover:text-gray-700" >
                <X size={18}/>
              </button>
              </div>
    
        {/* Forms */}

          <div className="space-y-6">
             <div className='relative' ref={searchDropdownRef}>
              <label>
                Search Service
              </label>
              <input
                value={search}
                 onFocus={() => {setShowDropdown(true); Sparesearch("");}}
                onChange={(e) => Sparesearch(e.target.value)}
                placeholder="Search existing Spares..."
                className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer" 
              />
                {showDropdown && result.length > 0 && (
                <div className="absolute mt-1 w-full rounded-lg bg-white shadow-lg z-10 max-h-40 overflow-y-auto">
                  {result.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => Spareselect(service)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {service.service_name}
                    </div>
                  ))}
                </div>
              )}
             </div>

     {/* Service Name */}

             <div className="mb-4">
              <label className="text-sm font-medium">
                Service Name *
              </label>
              <input
                value={servicename}
                onChange={(e) => setserviceName(e.target.value)}
              className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer" />
            </div>

         
            {/* HSN */}
            <div className="mb-6">
              <label className="text-sm font-medium">
                HSN Code *
              </label>
              <input
                value={hsn}
                onChange={(e) => setHsn(e.target.value)}
                placeholder="998719"
                className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer" />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button onClick={handleSave}
                className="px-4 py-2 bg-black text-white rounded-lg"
              >
                Save Service
              </button>
            </div>
          </div>
        </div>
        {showPasswordModal && (
          <Addpassword onSuccess={handlePasswordSuccess} onClose={handlePasswordCancel} />
        )}
    </div>

  )
}

export default Spare;