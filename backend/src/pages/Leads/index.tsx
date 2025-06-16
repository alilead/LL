import { Routes, Route } from 'react-router-dom';
import { LeadList } from './LeadList';
import { LeadForm } from './LeadForm';
import { LeadDetail } from './LeadDetail';

export function LeadsPage() {
  return (
    <Routes>
      <Route index element={<LeadList />} />
      <Route path="new" element={<LeadForm />} />
      <Route path=":id" element={<LeadDetail />} />
    </Routes>
  );
}
