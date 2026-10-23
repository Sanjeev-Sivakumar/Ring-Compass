import React, { useState } from 'react';
import {
  Compass,
  Activity,
  Mic,
  ShieldCheck,
  Server,
  AlertTriangle,
  Menu,
  X,
  Volume2,
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import { NavTab } from '../types';

export interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: Compass },
  { id: 'motion', label: 'Motion Analysis', icon: Activity },
  { id: 'home_voice', label: 'Home & Voice', icon: Mic },
  { id: 'safety', label: 'Safety Engine', icon: ShieldCheck },
  { id: 'system', label: 'System & Events', icon: Server },
];

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (id: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab }) => {
  const { telemetry, diagnostics, triggerChime } = useTelemetry();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isCritical = telemetry?.verdict?.is_critical;
  const isProfileB = telemetry?.verdict?.verdict_type === 'PROFILE_B';

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE5DC] transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Identity: Ring Compass */}
          <div
            className="flex items-center space-x-3 cursor-pointer shrink-0"
            onClick={() => onSelectTab('overview')}
          >
            <div className="w-9 h-9 rounded-xl bg-[#1B3B2B] flex items-center justify-center text-white shadow-xs ring-1 ring-black/5">
              <Compass className="w-5 h-5 text-[#FAF8F5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[17px] font-heading font-medium tracking-tight text-[#1C201E]">Ring Compass</span>
                <span className="text-[10px] font-sans font-medium px-1.5 py-0.5 rounded bg-[#E8EFEA] text-[#1B3B2B] border border-[#1B3B2B]/20">
                  v2.0
                </span>
              </div>
              <p className="text-[12px] font-body text-[#57605A] hidden sm:block">
                Spatial Safety &amp; Biometric Triage
              </p>
            </div>
          </div>

          {/* Central Centered 5-Tab Navigation */}
          <nav className="hidden md:flex items-center space-x-1.5 bg-[#F4F0E8] p-1.5 rounded-xl border border-[#E5DFD4]">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-[13px] font-body transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-[#1B3B2B] shadow-xs border border-black/5 font-medium'
                      : 'text-[#57605A] hover:text-[#1C201E] hover:bg-black/5 font-normal'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#1B3B2B]' : 'text-[#8A948D]'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Persistent System Status & Incident Indicator */}
          <div className="flex items-center space-x-3">
            {/* Quick 432Hz Sound Test */}
            <button
              onClick={() => triggerChime('NAVBAR_TEST')}
              title="Test 432 Hz Solfeggio Acoustic Grounding Tone"
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#57605A] hover:text-[#1C201E] bg-[#F4F0E8] hover:bg-[#EAE5DC] border border-[#E2DDD3] transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#1B3B2B]" />
              <span>432Hz Test</span>
            </button>

            {/* Accurate Status Pill */}
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-sans font-semibold border transition-all ${
                isCritical
                  ? isProfileB
                    ? 'bg-[#FEE2E2] text-[#991B1B] border-[#F87171] animate-pulse'
                    : 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D] animate-pulse'
                  : diagnostics?.all_passed
                  ? 'bg-[#E8EFEA] text-[#1B3B2B] border-[#C3D7CA]'
                  : 'bg-[#E8EFEA] text-[#1B3B2B] border-[#C3D7CA]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCritical
                    ? isProfileB
                      ? 'bg-[#DC2626]'
                      : 'bg-[#D97706]'
                    : 'bg-[#10B981]'
                }`}
              />
              <span className="hidden sm:inline">
                {isCritical
                  ? isProfileB
                    ? 'Fall Alert'
                    : 'Wander Alert'
                  : 'System Online'}
              </span>
              <span className="sm:hidden font-sans">
                {isCritical ? 'Alert' : 'Online'}
              </span>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-[#F4F0E8] text-[#57605A] hover:text-[#1C201E] border border-[#E2DDD3]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-[#EAE5DC] space-y-1 bg-[#FAF8F5]">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                    isActive
                      ? 'bg-[#1B3B2B] text-white'
                      : 'text-[#57605A] hover:bg-[#F4F0E8] hover:text-[#1C201E]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8A948D]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

      </div>
    </header>
  );
};
