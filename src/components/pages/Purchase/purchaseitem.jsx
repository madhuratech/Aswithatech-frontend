import React from "react";
import { useNavigate } from "react-router-dom";
import PurchaseItems from "../../forms/purchaseform";
import { ArrowLeft, Plus, SquarePen, Trash2 } from "lucide-react";
import { errorToast, successToast } from "../../ui/nottifications";
import API_BASE_URL from "../../../config/api";

const Stock = () => {
  const navigate = useNavigate();
  const [openForm, setOpenForm] = React.useState(false);
  const [purchaseItems, setPurchaseItems] = React.useState([]);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [editOpen,setEditOpen] = React.useState(false);
  

  const Api_Urls = `${API_BASE_URL}/purchaseitems`;

  // Fetch purchase items
   const FetchPurchaseItems = async () => {
    try {
      const res = await fetch(`${Api_Urls}/all`);
      const data = await res.json();
      setPurchaseItems(data);
    } catch (error) {
      console.error("Error fetching purchase items:", error);
    }
  };

  React.useEffect(() => {
    FetchPurchaseItems();
  }, []);

//edit purchase item
  const handleEditClick = (item) => {
    setSelectedItem(item);
    setOpenForm(false);
    setEditOpen(true);
  };
  

  // Delete purchase item
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${Api_Urls}/delete/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        FetchPurchaseItems();
      }
    } catch (error) {
      console.error("Error deleting purchase item:", error);
      errorToast("Failed to delete purchase item");
      successToast("Purchase item deleted successfully");
    }
  };


  return (
       <div className="bg-white rounded-xl border p-6 overflow-y-auto h-[70vh]">

        <div className="flex justify-between mb-5">

           <div className="flex items-center gap-6">
    {/* Back Button */}
     <button
      onClick={()=>navigate("/purchase")}
      className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[15px] font-medium"
    >
      <ArrowLeft size={16}/>
      Back
    </button>

    {/* HEADING */}
    <div>
      <h2 className="text-[24px] font-semibold text-[#101828]">
        Purchase Item Master
      </h2>
      <p className="text-[14px] text-[#667085] mt-1">
        Manage purchase items and inventory
      </p>
     </div>
    </div>
        
          <div className="flex items-center gap-4">
             <button onClick={() => setOpenForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800">
               <Plus size={16} />
                Add Purchase Item
             </button>
          </div>


        </div>

       {/* Forms */}
               {openForm && <PurchaseItems onclose={() => setOpenForm(false)}
                refresh={() => FetchPurchaseItems()}/>}

                {/* edit open */}

                {editOpen && selectedItem &&(<PurchaseItems onclose={() => setEditOpen(false)}
                 editItem={true} purchase={selectedItem} refresh={() => FetchPurchaseItems()}/>)}
  
  {/* Purchase Items table*/}
     <div className="overflow-y-auto">
          <table className="w-full text-left border-collapseml-6">
            <thead >
              <tr className="text-left text-[12px] font-[400]  font-[Arial] text-[#6A7282] border-b">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">PURCHASE ITEMS</th>
                <th className="py-3 px-4">HSN CODE</th>
                <th className="py-3 px-4">ACTIONS</th>
              </tr>
            </thead>

            {/* body */}

            <tbody>
              {purchaseItems.map((p,item) => (
              <tr key={p.id} className="border-b text-[#101828] text-sm hover:bg-gray-50">
                <td className="p-2"> #PRS{String(item + 1).padStart(3, "0")}</td>
                <td className="py-4 px-4 font-medium">{p.item_name}</td>
                <td className="py-4 px-4">{p.hsn_number}</td>
                <td className="py-4 px-4 text-center">
                <div className="flex gap-4">
                 <SquarePen
            size={16}
            className="cursor-pointer text-gray-600 hover:text-black "
            onClick={() => handleEditClick(p)}
          />  
          <Trash2
            size={16}
            className="cursor-pointer text-red-500"
              onClick={() => handleDelete(p.id)}
          />
        </div>
      </td>
       </tr>
              ))}
            </tbody>
          </table>
         </div>
  


  </div>
    ) 
};
export default Stock;
