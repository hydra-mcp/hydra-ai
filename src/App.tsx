import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Login } from './Login';
import { AppLayout } from '@/layouts/AppLayout';
import { ChatPage } from '@/pages/ChatPage';
import { Toaster } from '@/components/ui/toaster';
import { ErrorHandler } from '@/components/ErrorHandler';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Global Toaster for notifications */}
        <Toaster />

        {/* Global API error handler */}
        <ErrorHandler />

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<ChatPage />} />
              {/* Add more routes here as needed */}
            </Route>
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
