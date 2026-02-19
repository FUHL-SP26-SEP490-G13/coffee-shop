import React, { useEffect, useState } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import { APP_ROUTES, STORAGE_KEYS } from "../constants";
import LoginPage from "../pages/authentication/LoginPage";
import RegisterPage from "../pages/authentication/RegisterPage";
import { StaffApp } from "../pages/staff/StaffApp";
import { BaristaApp } from "../pages/barista/BaristaApp";
import { BaristaDashboard } from "../pages/barista/BaristaDashboard";
import { BaristaOrders } from "../pages/barista/BaristaOrders";
import { BaristaSchedule } from "../pages/barista/BaristaSchedule";
import { BaristaAttendance } from "../pages/barista/BaristaAttendance";
import { BaristaRequests } from "../pages/barista/BaristaRequests";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminUsers from "../pages/admin/AdminUsers";
import authenticationService from "../services/authenticationService";
import HomePage from "@/pages/HomePage";
import ChangePasswordPage from "../pages/authentication/ChangePasswordPage";
import ForgotPasswordPage from "../pages/authentication/ForgotPasswordPage";
import AdminStaffSchedule from "@/pages/admin/AdminStaffSchedule";
import AdminInventory from "@/pages/admin/AdminInventory";
import { UserProfile } from "@/pages/common/UserProfile";
import AdminNewsCreatePage from "@/pages/admin/AdminNew/AdminNewsCreatePage";
import AdminNewsList from "@/pages/admin/AdminNew/AdminNewsList";
import AdminProducts from "@/pages/admin/AdminProduct/AdminProducts";
import NewsDetailPage from "@/components/news/NewsDetailPage";
import AdminEditNewsPage from "@/pages/admin/AdminNew/AdminEditNewsPage";
import AdminNewsDetailPage from "@/pages/admin/AdminNew/AdminNewsDetailPage";
import NewsListPage from "@/components/news/NewsListPage";
import AdminDashboard from "../pages/admin/AdminDashboard/AdminDashboard";
import AdminDiscounts from "@/pages/admin/AdminDiscount/AdminDiscounts";
import AdminDiscountCreate from "@/pages/admin/AdminDiscount/AdminDiscountCreate";
import AdminDiscountEdit from "@/pages/admin/AdminDiscount/AdminDiscountEdit";
import OrderPolicy from "@/pages/common/OrderPolicy";
import PrivacyPolicy from "@/pages/common/PrivacyPolicy";
import AdminNewsletter from "@/pages/admin/AdminNewletter/AdminNewsletter";
import AdminApp from "../pages/admin/AdminApp";
import { StaffPOS } from "@/pages/staff/StaffPOS";
import { StaffAttendance } from "@/pages/staff/StaffAttendance";
import { StaffKitchen } from "@/pages/staff/StaffKitchen";
import { StaffInventory } from "@/pages/staff/StaffInventory";
import { StaffRequests } from "@/pages/staff/StaffRequests";
import { StaffTables } from "@/pages/staff/StaffTables";
import { StaffSchedule } from "@/pages/staff/StaffSchedule";


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
    case 4:
      return APP_ROUTES.CUSTOMER;
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
      <Route
        path={APP_ROUTES.FORGOT_PASSWORD}
        element={<ForgotPasswordPage />}
      />

      <Route
        path={APP_ROUTES.CHANGE_PASSWORD}
        element={
          <RoleGuard allowedRoles={[1, 2, 3, 4]}>
            <ChangePasswordPage />
          </RoleGuard>
        }
      />

      {/* STAFF NESTED ROUTES */}
      <Route
        path="/staff"
        element={
          <RoleGuard allowedRoles={[2]}>
            <StaffApp />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="pos" replace />} />
        <Route path="pos" element={<StaffPOS />} />
        <Route path="attendance" element={<StaffAttendance/>} />
        <Route path="inventory" element={<StaffInventory />} />
        <Route path="kitchen" element={<StaffKitchen />} />
        <Route path="requests" element={<StaffRequests />} />
        <Route path="tables" element={<StaffTables />} />
        <Route path="schedule" element={<StaffSchedule />} /> 
        <Route path="profile" element={<UserProfile />} />
      </Route>

      {/* BARISTA NESTED ROUTES */}
      <Route
        path="/barista"
        element={
          <RoleGuard allowedRoles={[3]}>
            <BaristaApp />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<BaristaDashboard />} />
        <Route path="orders" element={<BaristaOrders />} />
        <Route path="attendance" element={<BaristaAttendance />} />
        <Route path="schedule" element={<BaristaSchedule />} />
        <Route path="requests" element={<BaristaRequests />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>

      {/* ADMIN NESTED ROUTES */}
      <Route
        path="/admin"
        element={
          <RoleGuard allowedRoles={[1]}>
            <AdminApp />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="schedule" element={<AdminStaffSchedule />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="create-news" element={<AdminNewsCreatePage />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="news-list" element={<AdminNewsList />} />
        <Route path="edit-news/:id" element={<AdminEditNewsPage />} />
        <Route path="news-detail/:slug" element={<AdminNewsDetailPage />} />
        <Route path="discounts" element={<AdminDiscounts />} />
        <Route path="discounts/create" element={<AdminDiscountCreate />} />
        <Route path="discounts/edit/:id" element={<AdminDiscountEdit />} />
        <Route path="newsletter" element={<AdminNewsletter />} />
      </Route>

      <Route path="/news/:slug" element={<NewsDetailPage />} />
      <Route path="/news" element={<NewsListPage />} />
      <Route path="/customer/profile" element={<UserProfile />} />
      <Route path="/order-policy" element={<OrderPolicy />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />

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
