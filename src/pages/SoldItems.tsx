// Redirect to new SoldItemsReport page
import { Navigate } from 'react-router-dom';

export default function SoldItems() {
  return <Navigate to="/sales/items" replace />;
}