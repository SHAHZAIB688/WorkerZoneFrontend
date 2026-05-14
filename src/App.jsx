import { Navigate, Route, Routes } from "react-router-dom";
import BackendStatusModal from "./components/BackendStatusModal";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Loader from "./components/Loader";
import HomePage from "./pages/home";
import SignupPage from "./pages/signup";
import LoginPage from "./pages/login";
import ContactPage from "./pages/contact";
import DashboardPage from "./pages/dashboard";
import AboutPage from "./pages/about";
import TermsPage from "./pages/terms";
import DoctorsPage from "./pages/doctors";
import DoctorDetailsPage from "./pages/doctor-details";
import PatientStoreItemDetailPage from "./pages/patient-dashboard/PatientStoreItemDetailPage";

const App = () => (
  <>
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/doctors" element={<DoctorsPage />} />
        <Route path="/doctors/:doctorId" element={<DoctorDetailsPage />} />
        <Route
          path="/dashboard/store/:itemId"
          element={(
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientStoreItemDetailPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
    <BackendStatusModal />
  </>
);

export default App;
