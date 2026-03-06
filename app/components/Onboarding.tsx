'use client';

import { useState } from 'react';
import { Zap, FolderOpen, FolderPlus, ArrowRight, ArrowLeft, Loader2, Terminal, MessageSquare } from 'lucide-react';
import type { AgentType } from '@/lib/types';

type FolderMode = 'pick' | 'create';

interface OnboardingProps {
    onComplete: (vaultPath: string, agentType: AgentType) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [agentType, setAgentType] = useState<AgentType | null>(null);
    const [folderMode, setFolderMode] = useState<FolderMode | null>(null);
    const [vaultPath, setVaultPath] = useState('');
    const [parentPath, setParentPath] = useState('');
    const [folderName, setFolderName] = useState('meridian');
    const [error, setError] = useState('');
    const [binding, setBinding] = useState(false);
    const [picking, setPicking] = useState(false);

    const handleSelectAgent = (type: AgentType) => {
        setAgentType(type);
        setStep(2);
    };

    const handlePickFolder = async () => {
        setPicking(true);
        setError('');
        try {
            const res = await fetch('/api/pick-folder', { method: 'POST' });
            const data = await res.json();
            if (data.success && data.path) {
                if (folderMode === 'create') {
                    setParentPath(data.path);
                } else {
                    setVaultPath(data.path);
                }
            } else if (data.cancelled) {
                // User cancelled
            } else {
                setError(data.error || '选择失败');
            }
        } catch {
            setError('无法打开文件选择器');
        }
        setPicking(false);
    };

    const getEffectivePath = () => {
        if (folderMode === 'create' && parentPath && folderName.trim()) {
            return `${parentPath}/${folderName.trim()}`;
        }
        return vaultPath;
    };

    const handleBind = async () => {
        const effectivePath = getEffectivePath();
        if (!effectivePath || !agentType) { setError('请先完成文件夹配置'); return; }
        setBinding(true);
        setError('');
        try {
            const res = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'bind-vault',
                    vaultPath: effectivePath,
                    agentType,
                    createIfMissing: folderMode === 'create',
                }),
            });
            const data = await res.json();
            if (data.success) {
                onComplete(effectivePath, agentType);
            } else {
                setError(data.error || '绑定失败');
            }
        } catch {
            setError('网络错误');
        }
        setBinding(false);
    };

    const canBind = folderMode === 'create'
        ? !!(parentPath && folderName.trim())
        : !!vaultPath.trim();

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
            <div className="max-w-lg w-full space-y-8 animate-fade-in-up">
                {/* Logo */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 animate-float">
                        <Zap className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold gradient-text">Meridian</h1>
                    <p className="text-muted-foreground">Obsidian 知识库 AI 驾驶舱</p>
                </div>

                {/* Step 1: Agent Selection */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <div className="text-sm font-medium mb-1">选择你的 AI Agent</div>
                            <div className="text-[11px] text-muted-foreground">选择你正在使用的 Agent 工具</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleSelectAgent('claude-code')}
                                className="glass-card rounded-2xl p-6 text-center hover:border-violet-500/40 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-3 group-hover:from-violet-500/30 group-hover:to-indigo-500/30 transition-all">
                                    <Terminal className="h-6 w-6 text-violet-400" />
                                </div>
                                <div className="font-semibold text-sm">Claude Code</div>
                                <div className="text-[10px] text-muted-foreground mt-1">通过终端启动 Claude CLI</div>
                            </button>
                            <button
                                onClick={() => handleSelectAgent('openclaw')}
                                className="glass-card rounded-2xl p-6 text-center hover:border-emerald-500/40 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-3 group-hover:from-emerald-500/30 group-hover:to-teal-500/30 transition-all">
                                    <MessageSquare className="h-6 w-6 text-emerald-400" />
                                </div>
                                <div className="font-semibold text-sm">OpenClaw</div>
                                <div className="text-[10px] text-muted-foreground mt-1">内嵌对话，直接在页面中交互</div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Folder Selection */}
                {step === 2 && (
                    <div className="glass-card rounded-2xl p-6 space-y-5">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { setStep(1); setFolderMode(null); setVaultPath(''); setParentPath(''); }}
                                className="w-8 h-8 rounded-lg bg-secondary/30 flex items-center justify-center hover:bg-secondary/50 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                            </button>
                            <div>
                                <div className="font-semibold text-sm">配置工作目录</div>
                                <div className="text-[10px] text-muted-foreground">
                                    已选择 {agentType === 'openclaw' ? 'OpenClaw' : 'Claude Code'}
                                </div>
                            </div>
                        </div>

                        {/* Folder mode toggle */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => { setFolderMode('pick'); setParentPath(''); }}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all ${
                                    folderMode === 'pick'
                                        ? 'border-violet-500/50 bg-violet-500/10 text-foreground'
                                        : 'border-border/50 bg-secondary/20 text-muted-foreground hover:bg-secondary/30'
                                }`}
                            >
                                <FolderOpen className="h-4 w-4" />
                                <span>选择已有文件夹</span>
                            </button>
                            <button
                                onClick={() => { setFolderMode('create'); setVaultPath(''); }}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all ${
                                    folderMode === 'create'
                                        ? 'border-violet-500/50 bg-violet-500/10 text-foreground'
                                        : 'border-border/50 bg-secondary/20 text-muted-foreground hover:bg-secondary/30'
                                }`}
                            >
                                <FolderPlus className="h-4 w-4" />
                                <span>创建新文件夹</span>
                            </button>
                        </div>

                        {/* Pick existing folder */}
                        {folderMode === 'pick' && (
                            <button
                                onClick={handlePickFolder}
                                disabled={picking}
                                className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl border-2 border-dashed border-border/60 hover:border-violet-500/40 bg-secondary/20 hover:bg-secondary/30 transition-all group"
                            >
                                {picking ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">请在弹出窗口中选择文件夹...</span>
                                    </>
                                ) : vaultPath ? (
                                    <>
                                        <FolderOpen className="h-5 w-5 text-violet-400" />
                                        <div className="text-left flex-1">
                                            <div className="text-sm font-medium truncate">{vaultPath.split('/').pop()}</div>
                                            <div className="text-[10px] text-muted-foreground truncate">{vaultPath}</div>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground group-hover:text-foreground">重新选择</span>
                                    </>
                                ) : (
                                    <>
                                        <FolderOpen className="h-5 w-5 text-muted-foreground group-hover:text-violet-400 transition-colors" />
                                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">点击选择文件夹</span>
                                    </>
                                )}
                            </button>
                        )}

                        {/* Create new folder */}
                        {folderMode === 'create' && (
                            <div className="space-y-3">
                                {/* Parent directory picker */}
                                <button
                                    onClick={handlePickFolder}
                                    disabled={picking}
                                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-border/60 hover:border-violet-500/40 bg-secondary/20 hover:bg-secondary/30 transition-all group"
                                >
                                    {picking ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">请选择父目录...</span>
                                        </>
                                    ) : parentPath ? (
                                        <>
                                            <FolderOpen className="h-5 w-5 text-violet-400" />
                                            <div className="text-left flex-1">
                                                <div className="text-[10px] text-muted-foreground">父目录</div>
                                                <div className="text-sm font-medium truncate">{parentPath}</div>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground group-hover:text-foreground">重选</span>
                                        </>
                                    ) : (
                                        <>
                                            <FolderOpen className="h-5 w-5 text-muted-foreground group-hover:text-violet-400 transition-colors" />
                                            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">点击选择父目录</span>
                                        </>
                                    )}
                                </button>

                                {/* Folder name input */}
                                <div>
                                    <label className="text-[11px] text-muted-foreground mb-1.5 block">文件夹名称</label>
                                    <input
                                        type="text"
                                        value={folderName}
                                        onChange={(e) => setFolderName(e.target.value)}
                                        placeholder="meridian"
                                        className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:border-violet-500/40 transition-colors"
                                    />
                                </div>

                                {/* Preview path */}
                                {parentPath && folderName.trim() && (
                                    <div className="px-3 py-2 rounded-lg bg-secondary/20 text-[10px] text-muted-foreground truncate">
                                        将创建: {parentPath}/{folderName.trim()}
                                    </div>
                                )}
                            </div>
                        )}

                        {error && <p className="text-xs text-red-400">{error}</p>}

                        {folderMode && (
                            <button
                                onClick={handleBind}
                                disabled={binding || !canBind}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {binding ? (
                                    <span>绑定中...</span>
                                ) : (
                                    <>
                                        <span>{folderMode === 'create' ? '创建并开始' : '开始使用'}</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}

                {/* Features preview */}
                <div className="grid grid-cols-3 gap-3">
                    {(agentType === 'openclaw' ? [
                        { emoji: '💬', text: '内嵌对话' },
                        { emoji: '🤖', text: 'Agents' },
                        { emoji: '📊', text: '文件分析' },
                    ] : [
                        { emoji: '🤖', text: 'Agent 指令' },
                        { emoji: '🧩', text: 'Skills 库' },
                        { emoji: '📊', text: '用量分析' },
                    ]).map((f) => (
                        <div key={f.text} className="glass-card rounded-xl p-3 text-center">
                            <div className="text-xl mb-1">{f.emoji}</div>
                            <div className="text-[11px] text-muted-foreground">{f.text}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
