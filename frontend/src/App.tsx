import React, { useState } from 'react';
import { TelemetryProvider } from './context/TelemetryContext';
import { Navbar } from './components/Navbar';
import { NavTab } from './types';
import { OverviewPage } from './pages/OverviewPage';
import { MotionAnalysisPage } from './pages/MotionAnalysisPage';
import { HomeVoicePage } from './pages/HomeVoicePage';
import { SafetyEnginePage } from './pages/SafetyEnginePage';
import { SystemEventsPage } from './pages/SystemEventsPage';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTabState] = useState<NavTab>(() => {
    const initialHash = window.location.hash.replace('#/', '').replace('#', '');
    if (['overview', 'motion', 'home_voice', 'safety', 'system'].includes(initialHash)) {
      return initialHash as NavTab;
    }
    return 'overview';
  });

  const setActiveTab = (tab: NavTab) => {
    setActiveTabState(tab);
    window.location.hash = `#/${tab}`;
  };

  React.useEffect(() => {
    (window as any).__setActiveTab = setActiveTab;
    const handleHashChange = () => {
      const h = window.location.hash.replace('#/', '').replace('#', '');
      if (['overview', 'motion', 'home_voice', 'safety', 'system'].includes(h)) {
        setActiveTabState(h as NavTab);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage onNavigate={(tab) => setActiveTab(tab)} />;
      case 'motion':
        return <MotionAnalysisPage />;
      case 'home_voice':
        return <HomeVoicePage />;
      case 'safety':
        return <SafetyEnginePage />;
      case 'system':
        return <SystemEventsPage />;
      default:
        return <OverviewPage onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C201E] flex flex-col font-sans selection:bg-amber-200 selection:text-amber-900">
      {/* Central Clean 5-Tab Navigation Bar */}
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderActivePage()}
      </main>

      {/* Refined Footer */}
      <footer className="border-t border-[#EAE5DC] bg-white/70 backdrop-blur-xs py-5 mt-10 font-sans">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-2.5">
            <span className="font-heading font-bold text-stone-900 text-sm tracking-tight">
              Ring Compass
            </span>
            <span>•</span>
            <span className="text-[12px] font-sans text-stone-600">Autonomous Spatial Safety &amp; Biometric Triage</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-stone-500">
            <span>OpenCV 4.10 Engine</span>
            <span>Alexa Connected Node @ 192.168.1.113</span>
            <span>Ollama Llama 3 Edge</span>
            <span>Ring MCP Protocol</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <TelemetryProvider>
      <AppContent />
    </TelemetryProvider>
  );
}

export default App;
