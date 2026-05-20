import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AppShell from '../pages/AppShell';
import DashboardPage from '../pages/Dashboard';
import CustomersPage from '../pages/Customer';
import LoginPage from '../pages/Login';
import RegisterPage from '../pages/Register';
import CustomerDetailsPage from '../pages/CustomerDetails';
import TransactionsPage from '../pages/Transactions';
import PaymentsPage from '../pages/Payments';
import SettingsPage from '../pages/Settings';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'customers', element: <CustomersPage /> },
          { path: 'customers/:customerId', element: <CustomerDetailsPage /> },
          { path: 'transactions', element: <TransactionsPage /> },
          { path: 'payments', element: <PaymentsPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]);