import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import Sidebar, { type View } from './components/Sidebar';
import Topbar from './components/Topbar';
import { computeNetworkHealth } from './engine';
import type { Segment, TrainPoint } from './types';

const Dashboard = lazy(() => import('./views/Dashboard'));
const MapView = lazy(() => import('./views/MapView'));
const Evaluation = lazy(() => import('./views/Evaluation'));
const Maintenance = lazy(() => import('./views/Maintenance'));
const Forecast = lazy(() => import('./views/Forecast'));
const Budget = lazy(() => import('./views/Budget'));

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64 w-full">
      <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [segments, setSegments] = useState<Segment[]>([]);
  const [trainHistory, setTrainHistory] = useState<TrainPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compute health metrics dynamically whenever segments data changes
  const health = useMemo(() => computeNetworkHealth(segments), [segments]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch data from local FastAPI backend
        // Note: We increase the limit to ensure we get all segments for the map/dashboard
        const [segmentsRes, trainingRes] = await Promise.all([
          fetch('http://localhost:8000/roads?limit=5000'),
          fetch('http://localhost:8000/training-history')
        ]);

        if (!segmentsRes.ok) throw new Error(`Segments fetch failed: ${segmentsRes.status}`);
        if (!trainingRes.ok) throw new Error(`Training history fetch failed: ${trainingRes.status}`);

        const segmentsData = await segmentsRes.json();
        const trainingData = await trainingRes.json();

        // FastAPI's /roads endpoint returns { total, offset, limit, roads: [...] }
        setSegments(segmentsData.roads || []);
        setTrainHistory(trainingData || []);
      } catch (err: any) {
        console.error("Backend connection failed:", err.message);
        setError("Failed to load data from backend.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50 text-red-600 p-4 text-center">
        <div>
          <h1 className="text-xl font-bold mb-2">Connection Error</h1>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex' }}>
      <Sidebar active={view} onNavigate={setView} />
      <div style={{ marginLeft: 56, flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Topbar view={view} totalSegments={segments.length} />
        <main className="flex-1 overflow-y-auto">
          {loading ? (
            <Spinner />
          ) : (
            <Suspense fallback={<Spinner />}>
              {view === 'dashboard' && <Dashboard health={health} segments={segments} trainHistory={trainHistory} />}
              {view === 'map' && <MapView segments={segments} />}
              {view === 'evaluation' && <Evaluation segments={segments} trainHistory={trainHistory} />}
              {view === 'maintenance' && <Maintenance segments={segments} />}
              {view === 'forecast' && <Forecast segments={segments} />}
              {view === 'budget' && <Budget segments={segments} />}
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
}