import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { lazy, Suspense } from 'react';
import { Box, Spinner } from '@chakra-ui/react';

// Importação preguiçosa (lazy) dos componentes de página
const Home = lazy(() => import('./pages/Home'));
const RelatarProblema = lazy(() => import('./pages/ReportProblem'));
const ListaProblemas = lazy(() => import('./pages/ProblemList'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Perfil = lazy(() => import('./pages/Perfil'));
const PrimeiroAdmin = lazy(() => import('./pages/PrimeiroAdmin'));
const Notificacoes = lazy(() => import('./pages/Notificacoes'));

export default function AppRoutes() {
  return (
    <Layout>
      <Suspense fallback={
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
          <Spinner size="xl" />
        </Box>
      }>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/relatar" element={<RelatarProblema />} />
          <Route path="/problemas" element={<ListaProblemas />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/primeiro-admin" element={<PrimeiroAdmin />} />
          <Route path="/notificacoes" element={<Notificacoes />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}