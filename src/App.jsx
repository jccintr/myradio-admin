import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth.jsx';
import Layout from './components/Layout.jsx';
import { Spinner } from './components/ui.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Radios from './pages/Radios.jsx';
import Categories from './pages/Categories.jsx';
import Cities from './pages/Cities.jsx';
import Lists from './pages/Lists.jsx';
import Users from './pages/Users.jsx';

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <Spinner />;
  if (!user) return <Login />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="radios" element={<Radios />} />
        <Route path="categorias" element={<Categories />} />
        <Route path="cidades" element={<Cities />} />
        <Route path="listas" element={<Lists />} />
        <Route path="usuarios" element={<Users />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
