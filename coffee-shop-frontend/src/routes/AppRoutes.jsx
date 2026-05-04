import React, { useEffect, useState } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import { APP_ROUTES, STORAGE_KEYS } from "../constants";
import LoginPage from "../pages/authentication/LoginPage";
import RegisterPage from "../pages/authentication/RegisterPage";
import AdminOrders from "../pages/admin/AdminOrder/AdminOrders";
import AdminUsers from "../pages/admin/AdminUser/AdminUsers";
import authenticationService from "../services/authenticationService";
import HomePage from "@/pages/homePage/home/HomePage";
import ChangePasswordPage from "../pages/authentication/ChangePasswordPage";
import ForgotPasswordPage from "../pages/authentication/ForgotPasswordPage";
import AdminIngredients from "../pages/admin/AdminIngredient/AdminIngredients";
import AdminSchedulePage from "../pages/admin/AdminSchedule/AdminSchedulePage";
import ShiftTemplatePage from "../pages/admin/AdminSchedule/ShiftTemplate/ShiftTemplatePage";
import WorkSchedulePage from "../pages/admin/AdminSchedule/WorkSchedule/WorkSchedulePage";
import { UserProfile } from "../pages/common/UserProfile";
import AdminNewsList from "../pages/admin/AdminNew/AdminNewsList";
import AdminProducts from "@/pages/admin/AdminProduct/AdminProducts";
import AdminCategories from "@/pages/admin/AdminCategory/AdminCategories";
import NewsDetailPage from "@/pages/homePage/news/NewsDetailPage";
import NewsListPage from "@/pages/homePage/news/NewsListPage";
import AdminDiscounts from "@/pages/admin/AdminDiscount/AdminDiscounts";
import OrderPolicy from "@/pages/common/OrderPolicy";
import PrivacyPolicy from "@/pages/common/PrivacyPolicy";
import AdminApp from "../pages/admin/AdminApp";
import AdminAttendance from "../pages/admin/AdminAttendance/AdminAttendance";
import { StaffAttendance } from "@/pages/staff/StaffAttendance";
import { StaffTables } from "@/pages/staff/StaffTables";
import { StaffSchedule } from "@/pages/staff/StaffSchedule";
import AdminBanner from "@/pages/admin/AdminBanner/AdminBanner";
import AdminTables from "@/pages/admin/AdminTables/AdminTables";
import AdminToppings from "../pages/admin/AdminTopping/AdminToppings";
import PaymentPolicyPage from "@/pages/common/PaymentPolicyPage";
import { BaristaDB } from "@/pages/barista/BaristaDashboard/BaristaDB";
import { BaristaOrders } from "@/pages/barista/BaristaOrder/BaristaOrders";
import { BaristaAttendance } from "@/pages/barista/BaristaAttendance/BaristaAttendance";
import { BaristaSchedule } from "@/pages/barista/BaristaSchedule/BaristaSchedule";
import { StaffAppWrapped } from "../pages/staff/StaffApp";
import { BaristaApp } from "@/pages/barista/BaristaApp";
import ProductDetailPage from "../pages/homePage/product/ProductDetailPage";
import CartPage from "@/pages/homePage/order/CartPage";
import CheckoutPage from "@/pages/homePage/order/CheckoutPage";
import OrderQRMenu from "@/pages/homePage/order/OrderQRMenu";
import MyOrderQRDetail from "@/pages/homePage/order/MyOrderQRDetail";
import PayOSReturnSuccess from "@/pages/common/PayOSReturnSuccess";
import AdminDB from "@/pages/admin/AdminDB/AdminDB";
import AdminReviews from "@/pages/admin/AdminReview/AdminReview";
import MyOrderOnlinePage from "../pages/homePage/order/MyOrderOnlinePage";
import MyOrderDetailPage from "../pages/homePage/order/MyOrderDetailPage";
import AdminReceiptSettings from "@/pages/admin/AdminReceiptSettings/AdminReceiptSettings";
import AdminFlashSales from "@/pages/admin/AdminFlashSale/AdminFlashSales";
import AdminReputation from "@/pages/admin/AdminReputation/AdminReputation";
import AdminLoyalty from "@/pages/admin/AdminLoyalty/AdminLoyalty";
import AttendanceKiosk from "@/pages/attendance/AttendanceKiosk";
import AdminEndOfDayReport from "@/pages/admin/AdminEndOfDayReport/AdminEndOfDayReport";
import AdminShiftReport from "@/pages/admin/AdminShiftReport/AdminShiftReport";
import TakeawayPOS from '../pages/staff/TakeawayPOS'
import { OrderDelivery } from '@/pages/staff/StaffOrderList';
import { StaffDashboard } from "@/pages/staff/StaffDashboard/StaffDashboard";
import StaffPayOSReturn from "@/pages/staff/StaffPayOSReturn";
import QrOrderPaymentSuccess from "@/pages/homePage/order/QrOrderPaymentSuccess";
import QrOrderPaymentCancel from "@/pages/homePage/order/QrOrderPaymentCancel";
import StoreInfoPage from "@/pages/common/StoreInfoPage";
import GenericSlugResolver from "../pages/common/GenericSlugResolver";
import AboutUsPage from "@/pages/common/AboutUsPage";
import ClientLayout from "@/components/layout/ClientLayout";
import { RequireOpenShift } from "@/components/staff/RequireOpenShift";

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
    case 5:
      return APP_ROUTES.ATTENDANCE;
    default:
      return APP_ROUTES.HOME;
  }
};

const RoleGuard = ({ allowedRoles, children }) => {
  const token = getStoredValue(STORAGE_KEYS.ACCESS_TOKEN);
  const [roleId, setRoleId] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      return;
    }

    authenticationService
      .getProfile()
      .then((res) => {
        setRoleId(Number(res?.data?.role_id));
      })
      .finally(() => {
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

const HomeEntryGuard = () => {
  const token = getStoredValue(STORAGE_KEYS.ACCESS_TOKEN);
  const [roleId, setRoleId] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      return;
    }

    authenticationService
      .getProfile()
      .then((res) => {
        setRoleId(Number(res?.data?.role_id));
      })
      .catch(() => {
        setRoleId(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        Đang tải...
      </div>
    );

  if ([1, 2, 3, 5].includes(roleId)) {
    return <Navigate to={getRoleHomeRoute(roleId)} replace />;
  }

  return <HomePage />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Client Routes are grouped below */}
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

      {/* ATTENDANCE */}
      <Route
        path="/attendance"
        element={
          <RoleGuard allowedRoles={[5]}>
            <AttendanceKiosk />
          </RoleGuard>
        }
      />
      {/* KIOSK */}
      <Route path="/kiosk/attendance" element={<AttendanceKiosk />} />
      {/* STAFF NESTED ROUTES */}
      <Route
        path="/staff"
        element={
          <RoleGuard allowedRoles={[2]}>
            <StaffAppWrapped />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StaffDashboard />} />

        <Route path="takeaway" element={<RequireOpenShift><TakeawayPOS /></RequireOpenShift>} />
        <Route path="payment-result" element={<StaffPayOSReturn />} />
        <Route path="orders" element={<Navigate to="pending" replace />} />
        <Route path="orders/:status" element={<RequireOpenShift><OrderDelivery /></RequireOpenShift>} />
        <Route path="barista-window" element={<RequireOpenShift><OrderDelivery /></RequireOpenShift>} />
        <Route path="attendance" element={<StaffAttendance />} />

        <Route path="tables" element={<RequireOpenShift><StaffTables /></RequireOpenShift>} />
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
        <Route path="dashboard" element={<BaristaDB />} />
        <Route path="orders" element={<BaristaOrders />} />
        <Route path="attendance" element={<BaristaAttendance />} />
        <Route path="schedule" element={<BaristaSchedule />} />
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
        <Route path="dashboard" element={<AdminDB />} />
        <Route path="end-of-day-report" element={<AdminEndOfDayReport />} />
        <Route path="shift-report" element={<AdminShiftReport />} />
        <Route path="menu/products" element={<AdminProducts />} />
        <Route path="menu/categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="ingredients" element={<AdminIngredients />} />
        <Route path="schedule" element={<AdminSchedulePage />}>
          <Route index element={<ShiftTemplatePage />} />
          <Route path="templates" element={<ShiftTemplatePage />} />
          <Route path="list" element={<WorkSchedulePage />} />
        </Route>
        <Route path="inventory" element={<AdminIngredients />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="news-list" element={<AdminNewsList />} />
        <Route path="discounts" element={<AdminDiscounts />} />
        <Route path="banners" element={<AdminBanner />} />
        <Route path="tables" element={<AdminTables />} />
        <Route path="toppings" element={<AdminToppings />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="reputation" element={<AdminReputation />} />
        <Route path="loyalty" element={<AdminLoyalty />} />

        <Route path="receipt-settings" element={<AdminReceiptSettings />} />
        <Route path="flash-sales" element={<AdminFlashSales />} />

      </Route>
      <Route element={<ClientLayout />}>
        <Route path="/" element={<HomeEntryGuard />} />
        {/* Route /products đã được chuyển vào /:slug (GenericSlugResolver) để chống chớp giật Grid */}
        <Route path="/products/:id" element={<ProductDetailPage />} />

        <Route path="/news/:slug" element={<NewsDetailPage />} />
        <Route path="/news" element={<NewsListPage />} />
        <Route path="/store" element={<StoreInfoPage />} />
        <Route path="/about-us" element={<AboutUsPage />} />
        <Route path="/customer/profile" element={<UserProfile />} />

        <Route path="/order-policy" element={<OrderPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/payment-policy" element={<PaymentPolicyPage />} />

        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/payment-result" element={<PayOSReturnSuccess />} />
        <Route
          path="/my-orders"
          element={
            <RoleGuard allowedRoles={[4]}>
              <MyOrderOnlinePage />
            </RoleGuard>
          }
        />
        <Route
          path="/my-orders/:id"
          element={
            <RoleGuard allowedRoles={[4]}>
              <MyOrderDetailPage />
            </RoleGuard>
          }
        />

        <Route path="/404" element={<div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]"><h1 className="text-2xl font-bold text-gray-500">404 - Trang không tồn tại</h1></div>} />
        <Route path="/:slug" element={<GenericSlugResolver />} />
      </Route>

      <Route path="/order" element={<OrderQRMenu />} />
      <Route path="/order/confirm" element={<MyOrderQRDetail />} />
      <Route path="/order/payment-success" element={<QrOrderPaymentSuccess />} />
      <Route path="/order/payment-cancel" element={<QrOrderPaymentCancel />} />

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
