import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <div className="min-h-screen">
      
      <div className="p-10">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;