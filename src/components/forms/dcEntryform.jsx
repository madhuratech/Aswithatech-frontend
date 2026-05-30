import React from "react";
import { useNavigate } from "react-router-dom";

const DcEntryForm = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-100"
            >
                Go Back
            </button>

            {/* Main Container */}
            <div className="max-w-6xl mx-auto bg-white p-8 mt-8 border rounded-lg shadow-sm">
                <h1 className="text-2xl font-bold mb-6">
                    SERVICE DC ENTRY
                </h1>

                {/* Form Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Supplier Name
                        </label>
                        <input
                            type="text"
                            placeholder="Enter Supplier Name"
                            className="w-full border p-3 rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            DC Number
                        </label>
                        <input
                            type="text"
                            placeholder="Enter DC Number"
                            className="w-full border p-3 rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            DC Date
                        </label>
                        <input
                            type="date"
                            className="w-full border p-3 rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Payment Terms
                        </label>
                        <input
                            type="text"
                            placeholder="Enter Payment Terms"
                            className="w-full border p-3 rounded-lg"
                        />
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 mt-8">
                    <button className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700">
                        Save
                    </button>

                    <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700">
                        Edit
                    </button>

                    <button className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700">
                        Delete
                    </button>
                </div>

                {/* Placeholder Table */}
                <div className="mt-10 border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 border">Sl No</th>
                                <th className="p-3 border">Item Name</th>
                                <th className="p-3 border">Quantity</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr>
                                <td className="p-3 border text-center">1</td>
                                <td className="p-3 border text-center">
                                    Demo Item
                                </td>
                                <td className="p-3 border text-center">10</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DcEntryForm;
