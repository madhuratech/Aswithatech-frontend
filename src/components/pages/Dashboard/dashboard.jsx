import React from "react";
import Statcard from "../../cards/dashboardcard";

const Home = () => {
  return (
    <div className="px-10 py-8 flex flex-col">
      <div className="flex-1">
        <div className="mb-8">
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome Back.. 👋
          </h3>
          <p className="text-sm text-slate-500 mt-1">Ashwitha Tech Management Dashboard</p>
        </div>
        <div>
          <Statcard />
        </div>
      </div>
      <footer className="mt-12 pt-6 border-t border-slate-100 text-center text-sm font-medium text-slate-400">
        Created by Madhura Technologies
      </footer>
    </div>
  );
};

export default Home;