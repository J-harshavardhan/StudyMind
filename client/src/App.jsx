import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Protected from './components/Protected';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Notes from './pages/Notes';
import Categories from './pages/Categories';
import NoteForm from './pages/NoteForm';
import NoteDetail from './pages/NoteDetail';

export default function App() {
  return (
    <>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/settings" element={<Protected><Settings /></Protected>} />
          <Route path="/notes" element={<Protected><Notes /></Protected>} />
          <Route path="/notes/new" element={<Protected><NoteForm /></Protected>} />
          <Route path="/notes/:id" element={<Protected><NoteDetail /></Protected>} />
          <Route path="/notes/:id/edit" element={<Protected><NoteForm /></Protected>} />
          <Route path="/categories" element={<Protected><Categories /></Protected>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" />
    </>
  );
}
