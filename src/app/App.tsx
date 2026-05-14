import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { ScopeProvider } from './lib/scope';
import { NotificationProvider } from './lib/notifications';
import { ToastProvider } from './lib/toast';
import { PermissionsProvider } from './lib/permissions-context';
import { AppShell } from './components/shell/AppShell';
import { EmptyState } from './components/layout/EmptyState';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import SelectScopePage from './pages/SelectScopePage';
import ProfilePage from './pages/ProfilePage';
import ReferentielHubPage from './pages/ReferentielHubPage';
import GeographyPage from './pages/GeographyPage';
import VillagesListPage from './pages/VillagesListPage';
import VillageDetailPage from './pages/VillageDetailPage';
import FacilitiesListPage from './pages/FacilitiesListPage';
import FacilityDetailPage from './pages/FacilityDetailPage';
import TeamsListPage from './pages/TeamsListPage';
import TeamDetailPage from './pages/TeamDetailPage';
import AdminUsersListPage from './pages/AdminUsersListPage';
import AdminUserDetailPage from './pages/AdminUserDetailPage';
import CartePage from './pages/CartePage';
import CarteAccessibilitePage from './pages/CarteAccessibilitePage';
import PilotagePage from './pages/PilotagePage';
import LogistiqueHubPage from './pages/LogistiqueHubPage';
import LogistiqueStockPage from './pages/LogistiqueStockPage';
import LogistiqueChaineFroidPage from './pages/LogistiqueChaineFroidPage';
import LogistiqueAllocationsPage from './pages/LogistiqueAllocationsPage';
import LogistiqueRestitutionsPage from './pages/LogistiqueRestitutionsPage';
import LogistiqueInventairePage from './pages/LogistiqueInventairePage';
import PlanificationHubPage from './pages/PlanificationHubPage';
import PlanificationNouveauPage from './pages/PlanificationNouveauPage';
import PlanificationDetailPage from './pages/PlanificationDetailPage';
import PlanificationAjustementPage from './pages/PlanificationAjustementPage';
import NomadeHubPage from './pages/NomadeHubPage';
import NomadeOpportuniteDetailPage from './pages/NomadeOpportuniteDetailPage';
import NomadeCartographiePage from './pages/NomadeCartographiePage';
import { PLACEHOLDER_ROUTES } from './data/placeholderRoutes';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}

function PlaceholderEmpty({
  icon,
  title,
  description,
  sprintName,
}: {
  icon: React.ComponentProps<typeof EmptyState>['icon'];
  title: string;
  description: string;
  sprintName: string;
}) {
  const navigate = useNavigate();
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      sprintName={sprintName}
      cta={{ label: 'Retour au tableau de bord', onClick: () => navigate('/dashboard') }}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PermissionsProvider>
          <ScopeProvider>
            <NotificationProvider>
              <ToastProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route
                  path="/select-scope"
                  element={
                    <ProtectedRoute>
                      <SelectScopePage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  element={
                    <ProtectedRoute>
                      <AppShell />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/pilotage" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/pilotage" element={<PilotagePage />} />
                  <Route path="/carte" element={<CartePage />} />
                  <Route path="/carte/accessibilite" element={<CarteAccessibilitePage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/admin/utilisateurs" element={<AdminUsersListPage />} />
                  <Route path="/admin/utilisateurs/:id" element={<AdminUserDetailPage />} />
                  <Route path="/referentiel" element={<ReferentielHubPage />} />
                  <Route path="/referentiel/geographie" element={<GeographyPage />} />
                  <Route path="/referentiel/villages" element={<VillagesListPage />} />
                  <Route path="/referentiel/villages/:id" element={<VillageDetailPage />} />
                  <Route path="/referentiel/formations" element={<FacilitiesListPage />} />
                  <Route path="/referentiel/formations/:id" element={<FacilityDetailPage />} />
                  <Route path="/referentiel/equipes" element={<TeamsListPage />} />
                  <Route path="/referentiel/equipes/:id" element={<TeamDetailPage />} />
                  <Route path="/logistique" element={<LogistiqueHubPage />} />
                  <Route path="/logistique/stock" element={<LogistiqueStockPage />} />
                  <Route path="/logistique/chaine-froid" element={<LogistiqueChaineFroidPage />} />
                  <Route path="/logistique/allocations" element={<LogistiqueAllocationsPage />} />
                  <Route path="/logistique/restitutions" element={<LogistiqueRestitutionsPage />} />
                  <Route path="/logistique/inventaire" element={<LogistiqueInventairePage />} />

                  <Route path="/planification" element={<PlanificationHubPage />} />
                  <Route path="/planification/nouveau" element={<PlanificationNouveauPage />} />
                  <Route path="/planification/:id" element={<PlanificationDetailPage />} />
                  <Route path="/planification/:id/ajustement" element={<PlanificationAjustementPage />} />
                  <Route path="/nomades" element={<NomadeHubPage />} />
                  <Route path="/nomades/opportunites/:id" element={<NomadeOpportuniteDetailPage />} />
                  <Route path="/nomades/cartographie" element={<NomadeCartographiePage />} />

                  {PLACEHOLDER_ROUTES.map((r) => (
                    <Route
                      key={r.path}
                      path={r.path}
                      element={
                        <PlaceholderEmpty
                          icon={r.icon}
                          title={r.title}
                          description={r.description}
                          sprintName={r.sprintName}
                        />
                      }
                    />
                  ))}

                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              </ToastProvider>
            </NotificationProvider>
          </ScopeProvider>
        </PermissionsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
