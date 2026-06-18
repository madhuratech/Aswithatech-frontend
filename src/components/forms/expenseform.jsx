import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { successToast,errorToast, loadingToast } from '../ui/nottifications';
import axios from 'axios';
import toast from 'react-hot-toast';
import Addpassword from "./addeditpassword";
import { usePasswordProtection } from "../../hooks/usePasswordProtection";
import { useOutsideClick } from "../../hooks/useOutsideClick";

const ExpenseForm = ({onClose,refresh}) => {
const [openIndex, setOpenIndex] = useState(null);
  useScrollLock(true);
  const { showPasswordModal, handlePasswordSuccess, handlePasswordCancel } = usePasswordProtection();

const [formData, setFormData] = useState([
  {
    expense_date: "",
    category: "",
    amount: "",
    expense_description: ""
  }
]);

  const categoryRefs = useRef([]);

  useOutsideClick(
    formData.map((_, i) => ({
      ref: { current: categoryRefs.current[i] },
      onClose: () => setOpenIndex(null),
    }))
  );

 const Saveexpenses = async(e) =>{
 e.preventDefault();
 const toastId = loadingToast("Adding Expense...");

 try{
   await axios.post("http://localhost:3000/api/expenses/new", formData);
   toast.dismiss(toastId);
   successToast("Expense Added");
   onClose();
   refresh();
 }catch(err){
  console.log("ERROR:", err);
  errorToast(err.response?.data?.message || err.message || "Fail To Add");
}
};

const addForm = () => {
  setFormData([...formData, { expense_date: "", category: "", amount: "", expense_description: "" }]);
};

const removeForm = (index) => {
  const updatedForms = [...formData];
  updatedForms.splice(index, 1);
  setFormData(updatedForms);
};

const handleChange = (index, field, value) => {
  const updatedForms = [...formData];
  updatedForms[index][field] = value;
  setFormData(updatedForms);
};

  const handleSaveExpenses = (e) => {
    e.preventDefault();
    Saveexpenses(e);
  };

  return (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
           <div className="bg-white w-[650px] mt-[180px] rounded-xl shadow-lg p-6 flex flex-col mb-[80px]">
            <div className="flex items-start justify-between mb-4">
             <div>
                 <h2 className="text-lg font-semibold">ADD NEW EXPENSE</h2>
             </div>
              <div>
                  <button onClick={onClose}>
                  <X className="text-gray-400 hover:text-gray-600" />
                  </button>
              </div>
          </div>

                <form onSubmit={handleSaveExpenses} className='space-y-5'>
                  {formData.map((form, index) => (
                    <div key={index} className="">
                    <div>
                        <label htmlFor="">Date</label>
                        <input type="date"
                        className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                        placeholder='Select Date' value={form.expense_date} onChange={(e)=> handleChange(index, "expense_date", e.target.value)}/> 
                    </div>

                      <div ref={el => { categoryRefs.current[index] = el; }} className="relative">
                        <label htmlFor="">Category</label>
                        <input
                          value={form.category}
                          onClick={() => setOpenIndex(index)}
                          readOnly
                          type="text"
                          placeholder='Select Category'
                          className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                        />
                          {openIndex === index && (
                           <div className="absolute top-full left-0 mt-1 w-full bg-white shadow p-3 rounded-lg border z-10">
                             <ul className="leading-8 cursor-pointer">
                              {["Fuel & Transports", "Food & Snacks", "Accommodation", "Utilities", "Others"].map((cat) => (
                                <li key={cat} onClick={() => { handleChange(index, "category", cat); setOpenIndex(null); }} className="hover:bg-gray-100 px-2 py-1 rounded">
                                  {cat}
                                </li>
                              ))}
                             </ul>
                          </div>
                          )}
                      </div>

                       <div>
                         <label htmlFor="">Amount (₹)</label>
                          <input type="number" 
                          step="0.01"
                          min="0"
                          value={form.amount}
                          onChange={(e) => handleChange(index, "amount", e.target.value)}
                          className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                          placeholder="0.00" />
                       </div>

                        <div>
                             <label htmlFor="">Description</label>
                             <input 
                              value={form.expense_description}
                              onChange={(e) => handleChange(index, "expense_description", e.target.value)}
                             className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer" rows="3" placeholder="Add description"/>
                        </div>

                            <div className='flex justify-end gap-3'>
                              {formData.length > 1 && (
                           <div className="mt-3">
                             <button onClick={() => removeForm(index)} className="text-sm text-red-500 hover:underline">
                               Remove
                             </button>
                           </div>
                          )}
                          <div >
                            <button type="button" onClick={addForm} className="text-sm text-blue-500 hover:underline mt-4">Add More</button>
                          </div>
                          </div>

                      </div>
                    ))}

                         <div className="relative p-5 top-4 flex justify-end gap-3 ">
                         <button onClick={onClose} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
                          <button type="submit" className="px-5 py-2 rounded-lg bg-black text-white text-sm">Save Data</button>
                        </div>
                </form>
           </div>

      {showPasswordModal && (
        <Addpassword onSuccess={handlePasswordSuccess} onClose={handlePasswordCancel} />
      )}
     </div>
  )
};

export default ExpenseForm;
