// Redirect to new Transactions page
import { Navigate } from 'react-router-dom';

export default function SalesHistory() {
  return <Navigate to="/sales/transactions" replace />;
}