import React from "react";
import { X } from "lucide-react";

const ViewCustomer = ({ onClose, customer, customerIdString }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
      <div className="bg-white w-[650px] mt-[220px] ml-20 rounded-xl shadow-lg p-6 flex flex-col mb-[80px]">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">View Customer Details</h2>
          </div>
          <div>
            <button onClick={onClose}>
              <X className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 text-left">
          {/* Customer ID & Name */}
          <div className="grid grid-cols-2 gap-7">
            <div>
              <label className="text-sm font-medium text-gray-500">Customer ID</label>
              <p className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm text-[#101828] font-medium outline-none cursor-not-allowed">
                {customerIdString}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Customer Name</label>
              <p className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm text-[#101828] font-medium outline-none cursor-not-allowed">
                {customer.customer_name || "N/A"}
              </p>
            </div>
          </div>

          {/* Type & Phone */}
          <div className="grid grid-cols-2 gap-7">
            <div>
              <label className="text-sm font-medium text-gray-500">Customer Type</label>
              <p className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm text-[#101828] outline-none cursor-not-allowed capitalize">
                {customer.customer_type === "new" ? "New Customer" : "Existing Customer"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm text-[#101828] outline-none cursor-not-allowed">
                {customer.phone || "N/A"}
              </p>
            </div>
          </div>

          {/* Email & Contact Person */}
          <div className="grid grid-cols-2 gap-7">
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm text-[#101828] outline-none cursor-not-allowed">
                {customer.email || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Contact Person</label>
              <p className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm text-[#101828] outline-none cursor-not-allowed">
                {customer.contact_person || "N/A"}
              </p>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-sm font-medium text-gray-500">Address</label>
            <p className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm text-[#101828] outline-none cursor-not-allowed whitespace-pre-wrap">
              {customer.address || "N/A"}
            </p>
          </div>

          {/* State & Pincode */}
          <div className="grid grid-cols-2 gap-7">
            <div>
              <label className="text-sm font-medium text-gray-500">State</label>
              <p className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm text-[#101828] outline-none cursor-not-allowed">
                {customer.state || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Pincode</label>
              <p className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm text-[#101828] outline-none cursor-not-allowed">
                {customer.pincode || "N/A"}
              </p>
            </div>
          </div>

          {/* GST Number */}
          <div>
            <label className="text-sm font-medium text-gray-500">GST Number</label>
            <p className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm text-[#101828] outline-none cursor-not-allowed">
              {customer.gst_number || "N/A"}
            </p>
          </div>

          {/* Footer Actions */}
          <div className="relative p-5 top-4 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCustomer;
