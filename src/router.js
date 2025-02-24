import { createRouter, createWebHistory } from "vue-router";
import HomePage from "./components/common/HomePage.vue";
import LoginPage from "./components/user/LoginPage.vue";
import RegisterPage from "./components/user/RegisterPage.vue";
import EditProfilePage from "./components/user/EditProfilePage.vue";
import TermsPage from "./components/common/TermsPage.vue";
import AdminDashboard from "./components/admin/AdminDashboard.vue";
import ForgotPasswordPage from "./components/user/ForgotPasswordPage.vue";
import ResetPasswordPage from "./components/user/ResetPasswordPage.vue";
import AddRide from "./components/rides/AddRide.vue";
import MyReservation from "./components/rides/MyReservation.vue";
import MyRides from "./components/rides/MyRides.vue";

const routes = [
  { path: "/", component: HomePage },
  { path: "/login", component: LoginPage },
  { path: "/register", component: RegisterPage },
  { path: "/edit-profile", component: EditProfilePage },
  { path: "/terms", component: TermsPage },
  { path: "/admin-dashboard", component: AdminDashboard },
  { path: "/forgot-password", component: ForgotPasswordPage },
  {
    path: "/reset-password",
    component: ResetPasswordPage,
  },
  { path: "/add-ride", component: AddRide },
  { path: "/my-reservation", component: MyReservation },
  { path: "/my-rides", component: MyRides },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
