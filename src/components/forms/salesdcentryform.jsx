import React from "react";
import { useNavigate } from "react-router-dom";

const SalesDCEntry = () => {
    const navigate = useNavigate(); 


  return (

     <div className="min-h-screen bg-gray-50 p-6 font-sans">
       <div>
         <button onClick={() => navigate(-1)} 
        className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[15px] font-medium w-fit">
           Go Back
         </button>
       </div>

       <div className="max-w-[1500px] mx-auto bg-white p-8 mt-8 shadow-sm border border-gray-200">
        {/* buttons */}
         <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-black tracking-tight">Quotation</h2>
          <div className="flex gap-1.5">
             <button  className='border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white'>NEW</button>
              <button  className='border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white'>SAVE</button>
              <button className='border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white'>EDIT</button>
              <button  className='border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white'>DELETE</button>
          </div>
        </div>

        {/* forms fields */}
        <div className="flex flex-row items-end gap-20 border-b border-gray-100 pb-8 mb-6">
      
          <div className='flex flex-col gap-2 flex-1 relative'>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Customer Name</label>
            <input type="text" className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" placeholder='Enter Customer Name'/>  
          </div> 
 
           {/* DC NO */}

           <div className='flex flex-col gap-2 flex-1 relative'>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">DC No</label>
            <input type="text" className="w-full max-w-[200px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" placeholder='Enter DC No'/>  
          </div>

          {/* DC Date */}

           <div className='flex flex-col gap-2 flex-1 relative'>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">DC Date</label>
            <input type="date" className="w-full max-w-[200px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" placeholder='Enter Customer Name'/>  
          </div>  

            {/* Slect Existing dc number */}

              <div className='flex flex-col gap-2 flex-1 relative'>
                <label htmlFor="existingDcNumber" className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Select Dc Number</label>
                 <input type="text" className="w-full max-w-[200px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" placeholder='Enter DC Number' />
              </div> 
         </div>

             {/* seccond row */}

         <div className=" grid grid-cols-4 gap-10  border-gray-100 pb-8 mb-6">
              {/* Order No */}
         <div className='flex flex-col gap-2 relative'>
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Order No</label>
            <input type="text"
             className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" placeholder='Enter Order No'/>  
        </div>
           {/* Order Date */}

           <div>
             <label htmlFor="orderDate" className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Order Date</label>
             <input type="date" id="orderDate" className="w-full mt-1 max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" />
           </div>

           {/* Payment Terms */}

              <div>
                <label htmlFor="paymentTerms" className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Payment Terms</label>
                <input type="text" id="paymentTerms" className="w-full mt-1 max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" placeholder='Enter Payment Terms'/>
              </div>

              {/* Despatch Through   */}

              <div>
                <label htmlFor="despatchThrough" className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Despatch Through</label>
                <input type="text" id="despatchThrough" className="w-full mt-1 max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" placeholder='Enter Despatch Through'/>  
              </div>
              
        </div> 
            {/* third row */}

           <div className="flex flex-row gap-20 ">  
             {/* Status */}
           <div className="flex flex-col gap-2 shrink-0 ">
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
              Status
             </label>
             <div className="flex items-center gap-4 h-[42px]">
              <label htmlFor="status1" className="flex items-center gap-2 text-[11px] font-bold text-gray-700 uppercase tracking-tight">
                <input type="radio" id="status1" name="status"  className="w-4 h-4 accent-black" />To Sell
              </label>
              <label htmlFor="status2" className="flex items-center gap-2 text-[11px] font-bold text-gray-700 uppercase tracking-tight">
                <input type="radio" id="status2" name="status" className="w-4 h-4 accent-black" />ReService
              </label>
            </div>
           </div>

           {/* Description */}
              <div className="flex flex-col gap-2 shrink-0">
                <label htmlFor="description" className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">Description</label>
                
                <div className="flex items-center gap-4 h-[42px]">
                    <label htmlFor="desc1" className="flex items-center gap-2 text-[11px] font-bold text-gray-700 uppercase tracking-tight">
                        <input type="radio" name="ordertype" className="w-4 h-4 accent-black" />Service
                    </label>  
                    <label htmlFor="desc2" className="flex items-center gap-2 text-[11px] font-bold text-gray-700 uppercase tracking-tight">
                        <input type="radio"  name="ordertype" className="w-4 h-4 accent-black" />Spares
                    </label>
                    <label htmlFor="desc3" className="flex items-center gap-2 text-[11px] font-bold text-gray-700 uppercase tracking-tight">
                        <input type="radio"  name="ordertype" className="w-4 h-4 accent-black" />Purchase Items
                    </label>
                </div>
           </div>
        </div>

        {/* 4th row */}
         <div className="grid grid-cols-8 gap-3 mt-6 mb-4 bg-white">
            
            <div className="flex flex-col col-span-2 relative">
                <input type="text" 
                className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition"
                placeholder="Items"      
                />
            </div>

            {/* Quantity */}

            <div className="flex flex-col relative">
              <input type="number"
              placeholder="Quantity"
              className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition" />
            </div>  

            {/* Price */}

            <div className="flex flex-col relative">
              <input type="number"
              placeholder="Price"
              className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition" />
           </div>

           {/* SlNo */}

            <div className="flex flex-col relative">
              <input type="number"
              placeholder="SlNo"
              className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition" />
             </div>

             {/* HSN */}
             
                <div className="flex flex-col relative">
                <input type="text"
                 placeholder="HSN" 
                 className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition" /> 
                </div>

                {/* UOM */}
                <div className="flex flex-col relative">
                  <input type="text"
                    placeholder="UOM"
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition" />
                </div>

                {/*Button  */}

                <div className="flex gap-2 relative">
                  <button className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Add</button>
                   <button className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Clear</button>
                </div>
         </div>

         {/* Table */}

        <div className="flex-grow border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white min-h-[200px]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 ">
              <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-16 uppercase">Sl No</th>
              <th className="px-4 py-2 text-[12px] font-bold text-gray-600 uppercase tracking-tight">Items</th>
              <th className="px-4 py-2 text-[12px] font-bold text-gray-600 uppercase tracking-tight">Quantity</th>
              <th className="px-4 py-2 text-[12px] font-bold text-gray-600 uppercase tracking-tight">Price</th>
              <th className="px-4 py-2 text-[12px] font-bold text-gray-600 uppercase tracking-tight">SlNo</th>
              <th className="px-4 py-2 text-[12px] font-bold text-gray-600 uppercase tracking-tight">HSN</th>
              <th className="px-4 py-2 text-[12px] font-bold text-gray-600 uppercase tracking-tight">UOM</th>
              <th className="px-4 py-2 text-[12px] font-bold text-gray-600 uppercase tracking-tight">Actions</th>
            </tr>
          </thead>

           <tbody>
                {/* Sample data row */} 
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors text-center">
                    <td className="px-4 py-2 border-t text-[13px] font-medium text-gray-800">1</td>
                    <td className="px-4 py-2 border-t text-[13px] font-medium text-gray-800">Item</td>
                    <td className="px-4 py-2 border-t text-[13px] font-medium text-gray-800">10</td>
                    <td className="px-4 py-2 border-t text-[13px] font-medium text-gray-800">100</td>
                    <td className="px-4 py-2 border-t text-[13px] font-medium text-gray-800">1</td>
                    <td className="px-4 py-2 border-t text-[13px] font-medium text-gray-800">123456</td>
                    <td className="px-4 py-2 border-t text-[13px] font-medium text-gray-800">Unit</td>
                    <td className="px-4 py-2 border-t text-[13px] font-medium text-gray-800">
                        <button className="text-blue-500 hover:text-blue-700">Edit</button>
                        <button className="text-red-500 hover:text-red-700 ml-2">Delete</button>
                    </td>
                </tr>
           </tbody>
 
        </table>
        </div>


       </div>
    </div>

    )
};

export default SalesDCEntry;