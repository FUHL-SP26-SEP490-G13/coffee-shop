import React, { useEffect, useState } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { APP_ROUTES, STORAGE_KEYS } from '../constants';

import LoginPage from '../pages/authentication/LoginPage';
import RegisterPage from '../pages/authentication/RegisterPage';
import { StaffApp } from '../pages/staff/StaffApp';
import { BaristaApp } from '../pages/barista/BaristaApp';
import { AdminDashboard } from '../pages/admin/AdminDashboard.jsx';
import authenticationService from '../services/authenticationService';

const getStoredValue = (key) =>
  localStorage.getItem(key) || sessionStorage.getItem(key);

const getRoleHomeRoute = (roleId) => {
  switch (roleId) {
    case 1:
      return APP_ROUTES.ADMIN;
    case 2:
      return APP_ROUTES.STAFF;
    case 3:
      return APP_ROUTES.BARISTA;
    default:
      return APP_ROUTES.HOME;
  }
};

// Component bảo vệ route dựa trên vai trò
const RoleGuard = ({ allowedRoles, children }) => {
  const token = getStoredValue(STORAGE_KEYS.ACCESS_TOKEN);
  const [roleId, setRoleId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setIsLoading(false);
      return undefined;
    }

    const loadProfile = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const response = await authenticationService.getProfile();
        if (!response?.success) {
          throw new Error(response?.message || 'Khong the tai profile');
        }

        const nextRoleId = Number(response?.data?.role_id);
        if (isMounted) {
          setRoleId(Number.isNaN(nextRoleId) ? null : nextRoleId);
        }
      } catch (error) {
        if (isMounted) {
          setHasError(true);
          setRoleId(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Nếu chưa đăng nhập, chuyển đến trang đăng nhập
  if (!token) {
    return <Navigate to={APP_ROUTES.LOGIN} replace />;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Dang tai thong tin...
      </div>
    );
  }

  if (hasError || !roleId) {
    return <Navigate to={APP_ROUTES.LOGIN} replace />;
  }

  // Nếu vai trò không được phép truy cập route này, chuyển hướng về trang chính 
  // của vai trò đó
  if (!allowedRoles.includes(roleId)) {
    return <Navigate to={getRoleHomeRoute(roleId)} replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path={APP_ROUTES.HOME} element={<LoginPage />} />
      <Route path={APP_ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={APP_ROUTES.REGISTER} element={<RegisterPage />} />

      {/** Các route dành cho Staff, Barista, Admin */}
      <Route
        path={APP_ROUTES.STAFF}
        element={
          <RoleGuard allowedRoles={[2]}>
            <StaffApp />
          </RoleGuard>
        }
      />
      <Route
        path={APP_ROUTES.BARISTA}
        element={
          <RoleGuard allowedRoles={[3]}>
            <BaristaApp />
          </RoleGuard>
        }
      />
      <Route
        path={APP_ROUTES.ADMIN}
        element={
          <RoleGuard allowedRoles={[1]}>
            <AdminDashboard />
          </RoleGuard>
        }
      />
      
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