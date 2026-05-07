import { useState, useMemo, lazy, Suspense } from 'react';
import Sidebar, { type View } from './components/Sidebar';
import Topbar from './components/Topbar';
import { generateSegments, computeNetworkHealth, generateTrainHistory } from './engine';

const Dashboard = lazy(() => import('./views/Dashboard'));
const MapView = lazy(() => import('./views/MapView'));
const Evaluation = lazy(() => import('./views/Evaluation'));
const Maintenance = lazy(() => import('./views/Maintenance'));
const Forecast = lazy(() => import('./views/Forecast'));
const Budget = lazy(() => import('./views/Budget'));

const segments = generateSegments();
const health = computeNetworkHealth(segments);
const trainHistory = generateTrainHistory(80);

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>('dashboard');

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex' }}>
      <Sidebar active={view} onNavigate={setView} />
      <div style={{ marginLeft: 56, flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Topbar view={view} totalSegments={health.total_roads} />
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<Spinner />}>
            {view === 'dashboard' && <Dashboard health={health} segments={segments} trainHistory={trainHistory} />}
            {view === 'map' && <MapView segments={segments} />}
            {view === 'evaluation' && <Evaluation segments={segments} trainHistory={trainHistory} />}
            {view === 'maintenance' && <Maintenance segments={segments} />}
            {view === 'forecast' && <Forecast segments={segments} />}
            {view === 'budget' && <Budget segments={segments} />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
