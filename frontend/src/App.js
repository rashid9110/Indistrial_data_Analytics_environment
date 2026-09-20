import Dashboard from './components/Dashboard';
import AlertFeed from './components/AlertFeed';
import './App.css';

function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">EDGE ANALYTICS / LIVE OPERATIONS</p>
          <h1>Predictive Maintenance Environment</h1>
        </div>
        <div className="connection-status">
          <span className="status-dot" />
          STREAM ACTIVE
        </div>
      </header>

      <section className="workspace">
        <Dashboard />
        <AlertFeed />
      </section>
    </main>
  );
}

export default App;
