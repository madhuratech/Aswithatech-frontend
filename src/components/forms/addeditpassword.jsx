import React, { useState, useRef, useEffect } from "react";
import { errorToast, successToast } from "../ui/nottifications";
import { X } from "lucide-react";
import { useOutsideClick } from "../../hooks/useOutsideClick";
const Addpassword = ({onSuccess,onClose}) => {
    const[password, setpassword]= useState("");
    const cardRef = useRef(null);

    useOutsideClick([{ ref: cardRef, onClose }]);

    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const verifypassword = (e) =>{
     e.preventDefault();
     const storedpassword = localStorage.getItem("adminPassword");
     if(password.trim() === storedpassword){
   successToast("Password Verified");
   onSuccess();
   onClose();
 }else{
   errorToast("Invalid Password");
 }
}

  return (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
        <div ref={cardRef} className="bg-white w-[450px] mt-[220px] ml-20 rounded-xl shadow-lg p-6 flex flex-col mb-[80px]">
             <div className="flex items-center justify-between mb-4 ">
                 <div>
                    <h2 className="text-lg font-semibold">Enter Password</h2>
                    <p>Enter the password to verify your identity</p>
                 </div>
                  <div>
                     <button onClick={onClose}>
                     <X size={18} className="text-gray-400 hover:text-gray-600"/>
                     </button>
                  </div>
             </div>
            
            <form onSubmit={verifypassword} className="space-y-6">
                <label htmlFor="password">Enter Password</label>
                <input
                type="password"
                value={password}
                onChange={(e) => setpassword(e.target.value)}
                 className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                 />
                <button type="submit" className="px-5 py-2 rounded-lg bg-black text-white text-sm">Verify</button>
            </form>
        </div>
     </div>
  )
};

export default Addpassword;
