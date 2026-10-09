import { lazy, Suspense, useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './store/store';
import AppShell from './crm/layout/AppShell';
import Entry from './crm/Entry';
import NotFound from './crm/NotFound';

const Landing = lazy(() => import('./landing/Landing'));
const Dashboard = lazy(() => import('./crm/pages/dashboard/Dashboard'));
const Pipeline = lazy(() => import('./crm/pages/leads/Pipeline'));
const LeadsList = lazy(() => import('./crm/pages/leads/LeadsList'));
const LeadCard = lazy(() => import('./crm/pages/leads/LeadCard'));
const Contacts = lazy(() => import('./crm/pages/contacts/Contacts'));
const ContactCard = lazy(() => import('./crm/pages/contacts/ContactCard'));
const Tasks = lazy(() => import('./crm/pages/tasks/Tasks'));
const Mail = lazy(() => import('./crm/pages/mail/Mail'));
const ChatsPage = lazy(() => import('./crm/pages/chats/ChatsPage'));
const Stats = lazy(() => import('./crm/pages/stats/Stats'));
const Market = lazy(() => import('./crm/pages/market/Market'));
const Settings = lazy(() => import('./crm/pages/settings/Settings'));
const Profile = lazy(() => import('./crm/pages/profile/Profile'));
const More = lazy(() => import('./crm/pages/more/More'));

/** Пускает в CRM только после того, как демо-данные загружены */
function CrmGate() {
  const demo = useStore((s) => s.demo);
  const ensureSeed = useStore((s) => s.ensureSeed);
  const [ready, setReady] = useState(false);
  // экран «Готовим вам воронку слива…» — один раз за сессию браузера
  const [intro, setIntro] = useState(() => !sessionStorageFlag());

  useEffect(() => {
    let alive = true;
    ensureSeed().then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [ensureSeed]);

  if (intro) return <Entry animate onDone={() => setIntro(false)} />;
  if (!ready || !demo) return <Entry />;
  return <AppShell />;
}

function sessionStorageFlag() {
  try {
    return sessionStorage.getItem('ls24-entered') === '1';
  } catch {
    return true;
  }
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<CrmGate />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="leads" element={<Pipeline />} />
            <Route path="leads/list" element={<LeadsList />} />
            <Route path="leads/:id" element={<LeadCard />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="contacts/:kind/:id" element={<ContactCard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="mail" element={<Mail />} />
            <Route path="chats" element={<ChatsPage />} />
            <Route path="stats" element={<Navigate to="pipeline" replace />} />
            <Route path="stats/:report" element={<Stats />} />
            <Route path="market" element={<Market />} />
            <Route path="settings" element={<Navigate to="general" replace />} />
            <Route path="settings/:section" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="more" element={<More />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="*" element={<NotFound standalone />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
