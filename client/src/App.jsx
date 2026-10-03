import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Protected from './components/Protected';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Notes = lazy(() => import('./pages/Notes'));
const Categories = lazy(() => import('./pages/Categories'));
const NoteForm = lazy(() => import('./pages/NoteForm'));
const NoteDetail = lazy(() => import('./pages/NoteDetail'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Assistant = lazy(() => import('./pages/Assistant'));
const Reminders = lazy(() => import('./pages/Reminders'));
const Focus = lazy(() => import('./pages/Focus'));

export default function App() {
  return (
    <>
      <Layout>
        <Suspense fallback={<div className="page-loading" role="status">Loading StudyMind...</div>}><Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/settings" element={<Protected><Settings /></Protected>} />
          <Route path="/notes" element={<Protected><Notes /></Protected>} />
          <Route path="/notes/new" element={<Protected><NoteForm /></Protected>} />
          <Route path="/notes/:id" element={<Protected><NoteDetail /></Protected>} />
          <Route path="/notes/:id/edit" element={<Protected><NoteForm /></Protected>} />
          <Route path="/categories" element={<Protected><Categories /></Protected>} />
          <Route path="/tasks" element={<Protected><Tasks /></Protected>} />
          <Route path="/calendar" element={<Protected><Calendar /></Protected>} />
          <Route path="/assistant" element={<Protected><Assistant /></Protected>} />
          <Route path="/reminders" element={<Protected><Reminders /></Protected>} />
          <Route path="/focus" element={<Protected><Focus /></Protected>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes></Suspense>
      </Layout>
      <Toaster position="top-right" toastOptions={{ duration: 3600, className: 'sm-toast', success: { iconTheme: { primary: '#35a879', secondary: '#fff' } }, error: { iconTheme: { primary: '#c65362', secondary: '#fff' } } }} />
    </>
  );
}
