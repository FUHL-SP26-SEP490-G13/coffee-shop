import React, { useEffect, useState } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import { APP_ROUTES, STORAGE_KEYS } from "../constants";

import LoginPage from "../pages/authentication/LoginPage";
import RegisterPage from "../pages/authentication/RegisterPage";
import { StaffApp } from "../pages/staff/StaffApp";
import { BaristaApp } from "../pages/barista/BaristaApp";
import AdminDashboard from "../pages/admin/AdminDashboard";

import AdminOverview from "../pages/admin/AdminOverview";
import AdminProducts from "../pages/admin/AdminProducts";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminUsers from "../pages/admin/AdminUsers";
import NewsCreatePage from "../pages/admin/NewsCreatePage";

import authenticationService from "../services/authenticationService";
import HomePage from "@/pages/HomePage";
import NewsListPage from "@/components/news/NewsListPage";
import NewsDetailPage from "@/components/news/NewsDetailPage";
import ChangePasswordPage from "../pages/authentication/ChangePasswordPage";
import ForgotPasswordPage from "../pages/authentication/ForgotPasswordPage";
import AdminStaffSchedule from "@/pages/admin/AdminStaffSchedule";
import AdminInventory from "@/pages/admin/AdminInventory";
import AdminVouchers from "@/pages/admin/AdminVouchers";
import { UserProfile } from "@/pages/common/UserProfile";

const getStoredValue = (key) =>
  localStorage.getItem(key) || sessionStorage.getItem(key);

const getRoleHomeRoute = (roleId) => {
  switch (roleId) {
    case 1:
      return "/admin";
    case 2:
      return APP_ROUTES.STAFF;
    case 3:
      return APP_ROUTES.BARISTA;
    default:
      return APP_ROUTES.HOME;
  }
};

const RoleGuard = ({ allowedRoles, children }) => {
  const token = getStoredValue(STORAGE_KEYS.ACCESS_TOKEN);
  const [roleId, setRoleId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    authenticationService.getProfile().then((res) => {
      setRoleId(Number(res?.data?.role_id));
      setIsLoading(false);
    });
  }, [token]);

  if (!token) return <Navigate to={APP_ROUTES.LOGIN} replace />;

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        Đang tải...
      </div>
    );

  if (!allowedRoles.includes(roleId))
    return <Navigate to={getRoleHomeRoute(roleId)} replace />;

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path={APP_ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={APP_ROUTES.REGISTER} element={<RegisterPage />} />
      <Route path={APP_ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />

      <Route
        path={APP_ROUTES.CHANGE_PASSWORD}
        element={
          <RoleGuard allowedRoles={[1, 2, 3]}>
            <ChangePasswordPage />
          </RoleGuard>
        }
      />

      {/* STAFF */}
      <Route
        path={APP_ROUTES.STAFF}
        element={
          <RoleGuard allowedRoles={[2]}>
            <StaffApp />
          </RoleGuard>
        }
      />

      {/* BARISTA */}
      <Route
        path={APP_ROUTES.BARISTA}
        element={
          <RoleGuard allowedRoles={[3]}>
            <BaristaApp />
          </RoleGuard>
        }
      />

      {/* ADMIN NESTED ROUTES */}
      <Route
        path="/admin"
        element={
          <RoleGuard allowedRoles={[1]}>
            <AdminDashboard />
          </RoleGuard>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="schedule" element={<AdminStaffSchedule />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="vouchers" element={<AdminVouchers />} />
        <Route path="create-news" element={<NewsCreatePage />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>

      {/* NEWS PUBLIC */}
      <Route path="/news" element={<NewsListPage />} />
      <Route path="/news/:slug" element={<NewsDetailPage />} />

      {/* 404 */}
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
