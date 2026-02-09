import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { APP_ROUTES } from '../constants';


// Import các Page
import Home from '../pages/Home';
import Login from '../pages/Login';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path={APP_ROUTES.HOME} element={<Home />} />
      <Route path={APP_ROUTES.LOGIN} element={<Login />} />
      
      {/* Route 404 - Not Found */}
      <Route 
        path="*" 
        element={
          <div className="flex h-screen items-center justify-center">
            <h1 className="text-2xl font-bold">404 - Trang không tồn tại</h1>
          </div>
        } 
      />
    </Routes>
  );
};

export default AppRoutes;