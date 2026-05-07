import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SquarePen, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const DcEntryForm = () => {
    const navigate = useNavigate();


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (clientRef.current && !clientRef.current.contains(event.target)) setClientOpen(false);
            if (itemRef.current && !itemRef.current.contains(event.target)) setItemOpen(false);
            if (remarksRef.current && !remarksRef.current.contains(event.target)) setRemarksOpen(false);
            if (unitRef.current && !unitRef.current.contains(event.target)) setUnitOpen(false);
            if (dcSearchRef.current && !dcSearchRef.current.contains(event.target)) setDcSearchOpen(false);
            if (editDcSearchRef.current && !editDcSearchRef.current.contains(event.target)) setEditDcSearchOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <button onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[15px] font-medium w-fit"
            >
                Go Back
            </button>

            <div className="max-w-[1500px] mx-auto bg-white p-8 mt-8 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-black tracking-tight">SERVICE DC ENTRY</h2>
                    <div className="flex gap-1.5">
                        <button  className='border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white'>NEW</button>
                        <button  className='border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white'>SAVE</button>
                        <button   className='border px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white'>EDIT</button>
                        <button className='border px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white'>DELETE</button>
                    </div>
                </div>

                {/* Input fields */}
                <div className="flex flex-row items-end gap-20 border-b border-gray-100 pb-8 mb-6">
                    <div className='flex flex-col gap-2 flex-1 relative' ref={clientRef}>
                        <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
                            Supplier Name
                        </label>
                        <input type="text"
                            placeholder="Enter Supplier Name"
                            value={formData.supplier_name}
                            onFocus={() => { setClientOpen(true); fetchClients(); }}
                            onChange={(e) => {
                                setFormData({ ...formData, supplier_name: e.target.value });
                                fetchClients(e.target.value);
                            }}
                            className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm"
                        />
                        {clientOpen && clients.length > 0 && (
                            <div className="absolute top-full mt-1 w-full max-w-[400px] bg-white border rounded-lg shadow-lg z-50">
                                {clients.map((client) => (
                                    <div key={client.id}
                                        className="p-2 hover:bg-blue-100 cursor-pointer"
                                        onClick={() => {
                                            setFormData({ ...formData, supplier_name: client.customer_name });
                                            setClientOpen(false);
                                        }}>
                                        {client.customer_name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Dc No with Inward Search */}
                    <div className='flex flex-col gap-2 flex-1 relative' ref={dcSearchRef}>
                        <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
                            DC Number (From Inward Entry)
                        </label>
                        <input type="text"
                            placeholder="Search Inward DC Number"
                            value={formData.dc_number}
                            onFocus={() => { setDcSearchOpen(true); searchInwardDc(""); }}
                            onChange={(e) => {
                                setFormData({ ...formData, dc_number: e.target.value });
                                searchInwardDc(e.target.value);
                            }}
                            className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm"
                        />
                        {dcSearchOpen && inwardList.length > 0 && (
                            <div className="absolute top-full mt-1 w-full max-w-[400px] bg-white border rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                                {inwardList.map((inward, idx) => (
                                    <div key={idx}
                                        className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                        onClick={() => {
                                            loadInwardData(inward.dc_number);
                                            setDcSearchOpen(false);
                                        }}>
                                        {inward.dc_number}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Dc Date */}
                    <div className='flex flex-col gap-2 flex-1 relative'>
                        <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
                            DC Date
                        </label>
                        <input type="date"
                            value={formData.dc_date}
                            onChange={(e) => setFormData({ ...formData, dc_date: e.target.value })}
                            className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" />
                    </div>
                </div>

                {/* Second Row */}
                <div className="flex flex-row items-end gap-20  border-gray-100 pb-8 mb-6">
                    <div className='flex flex-col gap-2 flex-1 relative'>
                        <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
                            Party DC No
                        </label>
                        <input type="text"
                            value={formData.party_dc_no}
                            onChange={(e) => setFormData({ ...formData, party_dc_no: e.target.value })}
                            placeholder="Enter Party DC Number"
                            className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm"
                        />
                    </div>

                    <div className='flex flex-col gap-2 flex-1 relative'>
                        <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
                            Party DC Date
                        </label>
                        <input type="date"
                            value={formData.party_dc_date}
                            onChange={(e) => setFormData({ ...formData, party_dc_date: e.target.value })}
                            className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm"
                        />
                    </div>

                    <div className='flex flex-col gap-2 flex-1 relative'>
                        <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
                            Payment Terms
                        </label>
                        <input type="text"
                            value={formData.payment_terms}
                            onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                            placeholder="Enter Payment Terms"
                            className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" />
                    </div>

                    <div className='flex flex-col gap-2 flex-1 relative'>
                        <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
                            Despatch Through
                        </label>
                        <input type="text"
                            value={formData.despatch_through}
                            onChange={(e) => setFormData({ ...formData, despatch_through: e.target.value })}
                            placeholder="Enter Despatch Through"
                            className="w-full max-w-[400px] p-2.5 border border-gray-200 rounded-lg text-[13px] font-semibold text-black focus:outline-none bg-white cursor-pointer shadow-sm" />
                    </div>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-2 shrink-0 border-b border-gray-100 pb-6 mb-6">
                    <label className="text-[12px] font-bold text-gray-600 uppercase tracking-tight">
                        Status
                    </label>
                    <div className="flex items-center gap-4 h-[42px]">
                        <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 cursor-pointer">
                            <input type="radio" name="status" checked={formData.status === "service"} onChange={() => { setFormData({ ...formData, status: "service" }); fetchItems("service"); }} className="w-4 h-4 accent-black" /> Service
                        </label>
                        <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 cursor-pointer">
                            <input type="radio" name="status" checked={formData.status === "re_service"} onChange={() => { setFormData({ ...formData, status: "re_service" }); fetchItems("re_service"); }} className="w-4 h-4 accent-black" /> Re Service
                        </label>
                    </div>
                </div>

                {/* Items input */}
                <div className="grid grid-cols-8 gap-2 mt-6 mb-4 bg-white">
                    <div className="flex flex-col col-span-2 relative" ref={itemRef}>
                        <input type="text"
                            placeholder="Item Name"
                            value={currentRow.item_name}
                            onFocus={() => { setItemOpen(true); if (formData.status) fetchItems(formData.status); }}
                            onChange={(e) => {
                                setCurrentRow({ ...currentRow, item_name: e.target.value });
                                if (formData.status) fetchItems(formData.status, e.target.value);
                            }}
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50 transition" />
                        {itemOpen && itemsList.length > 0 && (
                            <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                                {itemsList.map((item, idx) => (
                                    <div key={idx}
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                        onClick={() => {
                                            setCurrentRow({ ...currentRow, item_name: item.item_name, hsn: item.hsn_number || "" });
                                            setItemOpen(false);
                                        }}>
                                        {item.item_name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <input type="number"
                            value={currentRow.quantity}
                            onChange={(e) => setCurrentRow({ ...currentRow, quantity: e.target.value })}
                            placeholder="Quantity"
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50 transition" />
                    </div>

                    <div>
                        <input type="text"
                            value={currentRow.sl_no}
                            onChange={(e) => setCurrentRow({ ...currentRow, sl_no: e.target.value })}
                            placeholder="Sl No"
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition"
                        />
                    </div>
                    
                    <div>
                        <input type="text"
                            value={currentRow.recieved_qty}
                            onChange={(e) => setCurrentRow({ ...currentRow, recieved_qty: e.target.value })}
                            placeholder="Recieved Qty"
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50 transition" />
                    </div>

                    <div className="relative" ref={unitRef}>
                        <input type="text"
                            value={currentRow.uom}
                            onFocus={() => setUnitOpen(true)}
                            onChange={(e) => setCurrentRow({ ...currentRow, uom: e.target.value })}
                            placeholder="Uom"
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black outline-none bg-gray-50/50 transition"
                        />
                        {unitOpen && (
                            <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                                {["NOS", "KG", "MTR", "NO"].map((u, i) => (
                                    <div key={i} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                        onClick={() => { setCurrentRow({ ...currentRow, uom: u }); setUnitOpen(false); }}>
                                        {u}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <input type="text"
                            value={currentRow.hsn}
                            onChange={(e) => setCurrentRow({ ...currentRow, hsn: e.target.value })}
                            placeholder="Hsn"
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition"
                        />
                    </div>

                    <div className="flex items-center gap-2 ">
                        <button onClick={addRow} className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition">
                            ADD
                        </button>
                        <button onClick={() => setCurrentRow({ item_name: "", quantity: "", sl_no: "", recieved_qty: "", uom: "", hsn: "", remarks: "" })} className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-gray-400 transition">
                            CLEAR
                        </button>
                    </div>

                    {/* Remarks Dropdown */}
                    <div className="flex flex-col col-span-2 relative mt-2" ref={remarksRef}>
                        <input type="text"
                            value={currentRow.remarks}
                            onFocus={() => setRemarksOpen(true)}
                            onChange={(e) => setCurrentRow({ ...currentRow, remarks: e.target.value })}
                            placeholder="Remarks"
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition"
                        />
                        {remarksOpen && (
                            <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                                {["Damaged", "Serviced", "Sell"].map((remark, idx) => (
                                    <div key={idx}
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                        onClick={() => { setCurrentRow({ ...currentRow, remarks: remark }); setRemarksOpen(false); }}>
                                        {remark}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="mt-6 flex gap-2 items-start">
                    <div className="flex-grow border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white min-h-[200px]">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                                    <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-16 uppercase">Sl No</th>
                                    <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 uppercase">Item Name</th>
                                    <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-24 uppercase">Quantity</th>
                                    <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-20 uppercase">Unit</th>
                                    <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-24 uppercase">Rec. Qty</th>
                                    <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-24 uppercase">HSN</th>
                                    <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 uppercase">Remarks</th>
                                    <th className="p-3 text-[11px] font-black text-gray-500 border-r border-gray-100 w-20 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.length > 0 ? (
                                    tableData.map((item, index) => (
                                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-3 text-[12px] text-gray-700 font-medium border-r">{item.sl_no || index + 1}</td>
                                            <td className="p-3 text-[12px] text-gray-700 font-medium border-r">{item.item_name}</td>
                                            <td className="p-3 text-[12px] text-gray-700 font-medium border-r">{item.quantity}</td>
                                            <td className="p-3 text-[12px] text-gray-700 font-medium border-r">{item.uom}</td>
                                            <td className="p-3 text-[12px] text-gray-700 font-medium border-r">{item.recieved_qty}</td>
                                            <td className="p-3 text-[12px] text-gray-700 font-medium border-r">{item.hsn}</td>
                                            <td className="p-3 text-[12px] text-gray-700 font-medium border-r">{item.remarks}</td>
                                            <td className="p-3 text-[12px]">
                                                <div className="flex gap-4">
                                                    <SquarePen onClick={() => editItem(index)} className="w-4 h-4 text-blue-600 cursor-pointer hover:text-blue-800" />
                                                    <Trash2 onClick={() => deleteRow(index)} className="w-4 h-4 text-red-600 cursor-pointer hover:text-red-800" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-gray-400">
                                            No Items Added
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Select to EDit */}
                <div className="mt-10 p-5 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col md:flex-row items-center gap-6 relative">
                    <label className="text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] italic">
                        Select DC No To View / Modify Details :
                    </label>
                    <div className="relative w-[250px]" ref={editDcSearchRef}>
                        <input type="text"
                            placeholder="Enter DC Number"
                            value={loadDc}
                            onFocus={() => { setEditDcSearchOpen(true); }} // Assume we'd fetch saved DCs here
                            onChange={(e) => setLoadDc(e.target.value)}
                            className="w-full p-2.5 relative border border-gray-200 rounded-lg text-[13px] font-medium text-black  outline-none bg-gray-50/50 transition" />
                        {editDcSearchOpen && (
                            <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-50 p-3 text-sm text-gray-500">
                                Simulated: No saved DC entries yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
};

export default DcEntryForm;