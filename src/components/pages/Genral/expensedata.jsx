import API_BASE_URL from "../../../config/api";
import { useState,useEffect } from 'react';
import ExpenseForm from "../../forms/expenseform";
import { Plus } from "lucide-react";
const ExpenseData = () => {

const[open,setOpen] = useState(false);
const[expenses , setexpenses] = useState([]);


//Get All Expenses;
 
const Fetchexpenses = async() =>{
 const res = await fetch(`${API_BASE_URL}/expenses/all`)
 const data = await res.json();
setexpenses(data);
}
useEffect(()=>{
    Fetchexpenses();
},[]);

  return (
    <div  className="bg-white rounded-xl border p-6 overflow-y-auto h-[70vh]">
        <div className="flex items-center justify-between mb-5">
         <div>
            <h2 className="text-lg font-semibold mb-4">
                Daily Expenses
            </h2>
           <p>Track daily operational expenses like fuel, snacks, etc.</p>
         </div>

         {/* add button */}
           <div>
            <button onClick={()=> setOpen(true)} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg">
            <Plus size={20}/> Add Expense
            </button>
           </div>
         </div>

             {/*Form Open  */}
          <div>
            {open && <ExpenseForm onClose={() => setOpen(false)} refresh={Fetchexpenses}/>}
          </div>

          {/* table */}
   
           <div className="overflow-y-auto">
              <table className="w-full text-left border-collapseml-6">
                <thead>
                    <tr className="text-left text-[14px] font-[400]  font-[Arial] text-[#6A7282] border-b" >
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Expense Type</th>
                         <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {expenses.map((e,index)=>(
                        <tr key={e.id} className="border-b text-[#101828] text-sm hover:bg-gray-50" >
                            <td>EXP{String(index+1).padStart(3,"0")}</td>
                            <td className="py-4 px-4" >{new Date(e.expense_date).toLocaleDateString("en-IN")}</td>
                            <td className="py-4 px-4">{e.category}</td>
                            <td className="py-4 px-4">{e.expense_description}</td>
                            <td className="py-4 px-4">{e.amount}</td>

                        </tr>
                    ))}
                </tbody>

              </table>

           </div>
           
    </div>

  )
};

export default ExpenseData;
