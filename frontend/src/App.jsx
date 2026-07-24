import { Routes, Route, Navigate } from "react-router-dom";
import { Loader, Center } from "@mantine/core";
import { useAuth } from "./context/AuthContext";
import { SignUpForm } from "./components/SignUpForm";
import { LoginForm } from "./components/LoginForm";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";

// Wrapper for protected routes (Dashboard)
function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}

// Wrapper for public-only routes (Signup/Login)
function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public Route */}
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <SignUpForm />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginForm />
          </PublicOnlyRoute>
        }
      />

      {/* Protected Route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
