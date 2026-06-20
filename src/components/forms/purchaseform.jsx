import React,{useEffect, useRef}from "react";
import { Search, X } from "lucide-react";
import { useState } from "react";
import { errorToast,successToast } from "../ui/nottifications";
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import API_BASE_URL from "../../config/api";

const PurchaseForm = ({ onclose, editItem, purchase, refresh }) => {

      const { showPasswordModal, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();

      const [search, setSearch] = useState("");
      const modalRef = useRef(null);
      const searchRef = useRef(null);

      useOutsideClick([
        { ref: modalRef, onClose: onclose },
        { ref: searchRef, onClose: () => setShowDropdown(false) }
      ]);

      useEffect(() => {
        const handleKeyDown = (e) => {
          if (e.key === "Escape") {
            onclose();
          }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
      }, [onclose]);
      const[result,setResult] = useState([]);
      const [itemname, setItemName] = useState("");
      const [showDropdown, setShowDropdown] = useState(false);
      const [hsn, setHsn] = useState(853690);
    


  const Api_Urls = `${API_BASE_URL}/purchaseitems`;



   useEffect(() => {
    if (editItem && purchase) {
      setItemName(purchase.item_name || ""); 
      setHsn(purchase.hsn_number || 853690);
    }
  }, [purchase, editItem]);

// Save Purchase Item

const handleSave = () => {
  savePurchaseItem();
};

const savePurchaseItem = async (e) => {
    e.preventDefault();
  
    if (!itemname || !hsn) {
      errorToast("Please fill all fields");
      return;
    }

    try {
      let url;
      let method;
      if (editItem) {
        url = `${Api_Urls}/update/${purchase.id}`;
        method = "PUT";
      } else {
        url = `${Api_Urls}/new`;
        method = "POST";
      }


      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_name: itemname,
          hsn_number: hsn,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed");
      }

      successToast(editItem ? "Updated successfully" : "Added successfully");
      refresh();
      onclose();
    } catch (err) {
      errorToast(err.message);
    }
  };


//  Search Existing Items

  const purchaseSearch = async (value = "") => {
  setSearch(value);

  try {
    let url;
    if(!value){
      url = `${Api_Urls}/all`;
    } else {
      url = `${Api_Urls}/search/${encodeURIComponent(value)}`;

    }
   
    const res = await fetch(url);
    const data = await res.json();

    console.log("Search Results:", data);

    setResult(data);
    
    if (data.length > 0) {
      setItemName(data[0].item_name);
      setHsn(data[0].hsn_number || 853690);
    }

  } catch (error) {
    console.log("Error fetching search results:", error);
  }
};

// Search Dropdown;

const purchaseSelect = (selectedPurchase) => {
  console.log("SELECTED:", selectedPurchase); // MUST log

  setItemName(selectedPurchase.item_name);
  setHsn(selectedPurchase.hsn_number || 853690);
  setSearch(selectedPurchase.item_name);
  setResult([]);
  setShowDropdown(false);
};

// dropdown close;

    return(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">

   {/* Model */}
            <div ref={modalRef} className="bg-white w-[500px] mt-[150px]  ml-20 rounded-xl shadow-lg p-6 flex flex-col mb-[80px]">
                <div className="flex justify-content gap-6">
                     <div>
                        <h2 className="text-xl font-semibold text-gray-900"> Add New Purchase Item</h2>
                        <p className="text-sm text-gray-500 mt-1"> Enter purchase item details below.</p>
                     </div>
                       
             <button 
              onClick={onclose} 
               className=" ml-auto text-gray-500 hover:text-black">
              <X size={18}/>
          </button>
          </div>

         {/* Forms */}

             <div className="mt-5" ref={searchRef}>
             <label className="text-sm font-medium">Search Item</label>
            <div className="flex items-center mt-1 border rounded-xl px-3 py-2 bg-gray-50">
            <Search size={16} className="text-gray-400"/>
             <input
              type="text"
              value={search}
              onFocus={() =>{setShowDropdown(true); purchaseSearch("");}}
              onChange={(e) => purchaseSearch(e.target.value)}
              placeholder="Search existing items..."
              className="ml-2 w-full bg-transparent outline-none text-sm"/>
            </div>
            {showDropdown && result.length > 0 && (
              <div className="mt-1 w-full rounded-lg bg-white shadow-lg z-50 max-h-40 overflow-y-auto">
                {result.map((purchase) => (
                    <div key={purchase.id}
                    onClick={(e) =>{e.stopPropagation();  purchaseSelect(purchase);}} 
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
                    {purchase.item_name}
                </div>
                ))}
              </div>
            )}
           </div>

             {/* Item Name */}
      <div className="mt-4">
        <label className="text-sm font-medium">
          Item Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter item name"
          value={itemname}
          onChange={(e) => setItemName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
        />
      </div>


         <div className="mt-4">
        <label className="text-sm font-medium">
          HSN Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter HSN code"
          value={hsn}
          onChange={(e) => setHsn(e.target.value)}
          maxLength="6"
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
        />
      </div>

      {/* Buttons */}
          <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onclose}
          className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          className="px-4 py-2 rounded-lg bg-black text-white text-sm hover:bg-gray-800"
        >
          Save Item
        </button>
        </div>
      </div>

      {showPasswordModal && (
        <Addpassword onSuccess={handlePasswordSuccess} onClose={handlePasswordCancel} />
      )}
    </div>
  );
};
export default PurchaseForm;