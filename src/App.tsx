import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import theme from './theme';
import { Header } from './components/Header';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import RelatarProblema from './pages/RelatarProblema';
import Problemas from './pages/Problemas';
import { ProtectedRoute } from './components/ProtectedRoute';
import Admin from './pages/Admin';
import Home from './pages/Home';
import Mapa from './pages/Mapa';
import PrimeiroAdmin from './pages/PrimeiroAdmin';
import Perfil from './pages/Perfil';
import 'leaflet/dist/leaflet.css';
import './styles/leaflet.css';
import ScrollToTop from './ScrollToTop';

function App() {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Header />
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route
              path="/relatar"
              element={
                <ProtectedRoute>
                  <RelatarProblema />
                </ProtectedRoute>
              }
            />
            <Route path="/problemas" element={<Problemas />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="/mapa" element={<Mapa />} />
            <Route
              path="/primeiro-admin"
              element={
                <ProtectedRoute>
                  <PrimeiroAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Perfil />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ChakraProvider>
    </>
  );
}

export default App;