'use client';

import { useState, useEffect } from 'react';
import {
  Bot, ChevronLeft, ChevronRight, Sun, Moon, Zap, FolderOpen, BarChart3, Plus, MessageSquare,
  LayoutDashboard,
} from 'lucide-react';
import { Onboarding } from './components/Onboarding';
import { AgentPanel } from './components/AgentPanel';
import { FoldersPanel } from './components/FoldersPanel';
import { UsagePanel } from './components/UsagePanel';
import { OverviewPanel } from './components/OverviewPanel';
import { DynamicPanel } from './components/DynamicPanel';
import { NewNavModal } from './components/NewNavModal';
import type { AgentType, VaultConfig, PanelConfig } from '@/lib/types';

// Icon mapping for dynamic panels
const iconMap: Record<string, any> = {
  Bot, FolderOpen, BarChart3, Zap, MessageSquare,
};

export default function Home() {
  const [config, setConfig] = useState<VaultConfig | null>(null);
  const [agentMd, setAgentMd] = useState('');
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState('agent');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [showNewNavModal, setShowNewNavModal] = useState(false);

  const agentType: AgentType = config?.agentType || 'claude-code';
  const isOpenClaw = agentType === 'openclaw';

  // Default nav items (built-in core only)
  const defaultNavItems = [
    { id: 'agent', label: isOpenClaw ? 'OpenClaw' : 'Agent', icon: isOpenClaw ? MessageSquare : Bot },
    { id: 'folders', label: '文件夹', icon: FolderOpen },
    { id: 'usage', label: '用量分析', icon: BarChart3 },
  ];

  // Load config on mount
  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        if (data.config?.vaultPath) {
          setConfig(data.config);
          setAgentMd(data.agentMd || data.claudeMd || '');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  const handleVaultBound = (vaultPath: string, boundAgentType: AgentType = 'claude-code') => {
    setConfig({ vaultPath, boundAt: new Date().toISOString(), agentType: boundAgentType, panels: [] });
    fetch('/api/config')
      .then(r => r.json())
      .then(data => setAgentMd(data.agentMd || data.claudeMd || ''))
      .catch(() => { });
  };

  const handleRebind = () => {
    setConfig(null);
    setAgentMd('');
    setActivePanel('agent');
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-4">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // Onboarding if no vault bound
  if (!config?.vaultPath) {
    return <Onboarding onComplete={handleVaultBound} />;
  }

  // Navigation items = defaults + dynamic panels from config
  const navItems = [
    ...defaultNavItems,
    ...(config.panels || []).map(p => ({
      id: p.id,
      label: p.label,
      icon: iconMap[p.icon] || FolderOpen,
    })),
  ];

  const activePanelConfig = (config.panels || []).find(p => p.id === activePanel);

  // Get panel title
  const getPanelTitle = () => {
    const nav = navItems.find(n => n.id === activePanel);
    return nav?.label || 'Agent';
  };

  // Render panel content
  const renderPanel = () => {
    switch (activePanel) {
      case 'agent':
        return <AgentPanel vaultPath={config.vaultPath} agentMd={agentMd} agentType={agentType} onRebind={handleRebind} />;
      case 'folders':
        return <FoldersPanel vaultPath={config.vaultPath} agentType={agentType} />;
      case 'usage':
        return <UsagePanel agentType={agentType} />;
      default:
        if (activePanelConfig) {
          return <DynamicPanel panel={activePanelConfig} vaultPath={config.vaultPath} />;
        }
        return <AgentPanel vaultPath={config.vaultPath} agentMd={agentMd} agentType={agentType} onRebind={handleRebind} />;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background flex">
        {/* ─── Sidebar ─── */}
        <aside
          className={`fixed top-0 left-0 h-screen border-r border-border/50 bg-[var(--sidebar)] flex flex-col z-50 transition-all duration-300 ${sidebarCollapsed ? 'w-[72px]' : 'w-[220px]'
            }`}
        >
          {/* Logo */}
          <div className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <div className="font-bold text-sm gradient-text">Meridian</div>
                <div className="text-[10px] text-muted-foreground">AI 驾驶舱</div>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {navItems.map((item, idx) => (
              <div key={item.id}>
                {/* Separator between default and dynamic */}
                {idx === defaultNavItems.length && navItems.length > defaultNavItems.length && (
                  <div className="my-2 border-t border-border/30" />
                )}
                <div
                  className={`sidebar-nav-item ${activePanel === item.id ? 'active' : ''}`}
                  onClick={() => setActivePanel(item.id)}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </div>
              </div>
            ))}
            {/* Dashed "Add Nav" button */}
            <button
              onClick={() => setShowNewNavModal(true)}
              className="w-full mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-border/40 hover:border-violet-500/40 text-muted-foreground hover:text-violet-400 transition-all group"
            >
              <Plus className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span className="text-[11px]">新增导航</span>}
            </button>
          </nav>

          {/* Bottom: vault info + agent type + collapse */}
          <div className="p-3 border-t border-border/50 space-y-2">
            {!sidebarCollapsed && (
              <div className="px-3 py-2 rounded-lg bg-secondary/30 text-[10px] text-muted-foreground space-y-1">
                <div className="flex items-center gap-1">
                  <span>{isOpenClaw ? '🐾' : '🤖'}</span>
                  <span>{isOpenClaw ? 'OpenClaw' : 'Claude Code'}</span>
                </div>
                <div className="truncate" title={config.vaultPath}>
                  📁 {config.vaultPath.split('/').pop()}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between px-1">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${isOpenClaw
                ? 'bg-gradient-to-br from-emerald-600 to-teal-600'
                : 'bg-gradient-to-br from-violet-600 to-indigo-600'
                }`}>
                {isOpenClaw ? 'O' : 'V'}
              </div>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <main
          className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[220px]'
            }`}
        >
          {/* Header */}
          <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-border/50 bg-background/80">
            <div className="flex items-center justify-between px-6 h-14">
              <h1 className="text-lg font-semibold">{getPanelTitle()}</h1>
              <div className="flex items-center gap-3">
                <div className="px-2.5 py-1 rounded-md bg-secondary text-xs font-medium">
                  {new Date().toLocaleDateString('zh-CN')}
                </div>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                  title={isDark ? '切换浅色模式' : '切换深色模式'}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </header>

          {/* Panel Content */}
          <div className="p-6 max-w-5xl mx-auto">
            {renderPanel()}
          </div>
        </main>
      </div>

      {/* New Nav Modal */}
      {showNewNavModal && <NewNavModal onClose={() => setShowNewNavModal(false)} />}
    </>
  );
}
