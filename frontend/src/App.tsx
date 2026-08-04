import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { NotFound } from "./pages/NotFound";

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        containerStyle={{ top: 16, insetInline: 16 }}
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(255, 255, 255, 0.97)",
            backdropFilter: "blur(14px)",
            borderRadius: "16px",
            border: "1px solid rgba(91, 30, 46, 0.08)",
            boxShadow: "0 20px 40px -22px rgba(91, 30, 46, 0.35)",
            color: "#220b13",
          },
        }}
      />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AuthPage />} />
        <Route path="/auth" element={<Navigate to="/admin" replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AuthPage />
            </ProtectedRoute>
          }
        />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </>
  );
}

export default App;
