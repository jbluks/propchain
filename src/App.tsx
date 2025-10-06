import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { Navbar } from "./components/Layout/Navbar";
import { HomePage } from "./pages/HomePage";
import { ListingsPage } from "./pages/ListingsPage";
import { PropertyDetailPage } from "./pages/PropertyDetailPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { DashboardPage } from "./pages/DashboardPage";
import {
  connectMetaMaskWallet,
  Discovered,
  discoverProviders,
} from "./config/wallet";
import WalletsModal from "./components/Modals/Wallets";

const AppContent: React.FC = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState("");
  const [providers, setProviders] = useState<Discovered[]>([]);
  const [favorites, setFavorites] = useState(["1", "4"]);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleGetProviders = async () => {
    setIsOpen(true);
    const _providers = await discoverProviders();
    setProviders(_providers);
  };

  const handleConnectWallet = async () => {
    try {
      const { accounts } = await connectMetaMaskWallet();
      onConnected(accounts);
    } catch (e) {
      console.error(e);
      alert((e as Error).message); // or render nicely in UI
    }
  };

  const onConnected = (accounts: string[]) => {
    setWalletConnected(true);
    setDefaultAddress(accounts[0]);
  };

  const handleToggleFavorite = (propertyId: string) => {
    setFavorites((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handlePropertyClick = (propertyId: string) => {
    navigate(`/property/${propertyId}`);
  };

  return (
    <>
      <Navbar
        onConnectWallet={handleGetProviders}
        walletConnected={walletConnected}
        address={defaultAddress}
      />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              onToggleFavorite={handleToggleFavorite}
              onPropertyClick={handlePropertyClick}
            />
          }
        />
        <Route
          path="/listings"
          element={
            <ListingsPage
              onToggleFavorite={handleToggleFavorite}
              onPropertyClick={handlePropertyClick}
            />
          }
        />
        <Route
          path="/property/:id"
          element={
            <PropertyDetailPage onToggleFavorite={handleToggleFavorite} />
          }
        />
        <Route
          path="/favorites"
          element={
            <FavoritesPage
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onPropertyClick={handlePropertyClick}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <DashboardPage
              walletConnected={walletConnected}
              onConnectWallet={handleConnectWallet}
            />
          }
        />
      </Routes>

      <WalletsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        providers={providers}
        onConnected={onConnected}
        address={defaultAddress}
        isConnected={walletConnected}
      />
    </>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
