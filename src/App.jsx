import ProtectedRoute from "./components/(appState)/ProtectedRoute";
import BlogPost from "./components/landing-page/BlogPost";
import DashboardLayout from "./layouts/DashboardLayout";
import ManageEventLayout from "./layouts/ManageEventLayout";
import ScrollTop from "./components/layout-components/ScrollTop";
import MainLayout from "./layouts/MainLayout";
import AboutUs from "./routes/landing-page/AboutUs";
import BlogPage from "./routes/landing-page/BlogPage";
import HowItWorks from "./routes/landing-page/HowItWorks";
import Pricing from "./routes/landing-page/Pricing";
import MyEvents from "./routes/MyEvents";
import ResetPassword from "./routes/ResetPassword";
import ManageEvent from "./routes/ManageEvent";
import ManageEventHeader from "./components/manage-event/ManageEventHeader";
import EditEvent from "./routes/EditEvent";
import Withdraw from "./routes/Withdraw";
import Privacy from "./routes/legal/Privacy";
import Data from "./routes/legal/Data";
import Terms from "./routes/legal/Terms";
import LegalLayout from "./layouts/LegalLayout";
import { BrowserRouter, Route, Routes } from "react-router";
import { useRehydrateUser } from "./hooks/useRehydrateUser";
import VerifyPayment from "./routes/VerifyPayment";
import CreateEvent from "./routes/CreateEvent";
import EventPreview from "./routes/CreateEventPreview";
import Profile from "./routes/Profile";
import Settings from "./routes/Settings";
import EventDetails from "./routes/EventDetails";

function App() {
  useRehydrateUser(); // Rehydrate user on app load

  return (
    <BrowserRouter>
      <ScrollTop />
      <Routes>
        {/* Landing Page */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HowItWorks />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/about" element={<AboutUs />} />
        </Route>
        {/* Account Pages */}
        <Route path="/events/:slug" element={<EventDetails />} />
        {/* Legal Pages */}
        <Route element={<LegalLayout />}>
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/data" element={<Data />} />
          <Route path="/terms" element={<Terms />} />
        </Route>
        {/* Payment Verification */}
        <Route path="/verify-payment" element={<VerifyPayment />} />
        {/* Reset password */}
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/home" element={<MyEvents />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/event-preview" element={<EventPreview />} />
          <Route
            element={
              <ManageEventLayout>
                <ManageEventHeader />
              </ManageEventLayout>
            }
          >
            <Route path="/edit-event/:slug" element={<EditEvent />} />
            <Route path="/manage-event/:slug" element={<ManageEvent />} />
            <Route path="/manage-event/:slug/withdraw" element={<Withdraw />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
