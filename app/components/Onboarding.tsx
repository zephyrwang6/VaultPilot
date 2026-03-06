'use client';

import { useState } from 'react';
import { Zap, FolderOpen, ArrowRight, Loader2 } from 'lucide-react';

interface OnboardingProps {
    onComplete: (vaultPath: string) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
    const [vaultPath, setVaultPath] = useState('');
    const [error, setError] = useState('');
    const [binding, setBinding] = useState(false);
    const [picking, setPicking] = useState(false);

    const handlePickFolder = async () => {
        setPicking(true);
        setError('');
        try {
            const res = await fetch('/api/pick-folder', { method: 'POST' });
            const data = await res.json();
            if (data.success && data.path) {
                setVaultPath(data.path);
            } else if (data.cancelled) {
                // User cancelled — do nothing
            } else {
                setError(data.error || '选择失败');
            }
        } catch {
            setError('无法打开文件选择器');
        }
        setPicking(false);
    };

    const handleBind = async () => {
        if (!vaultPath.trim()) { setError('请先选择文件夹'); return; }
        setBinding(true);
        setError('');
        try {
            const res = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'bind-vault', vaultPath: vaultPath.trim() }),
            });
            const data = await res.json();
            if (data.success) {
                onComplete(vaultPath.trim());
            } else {
                setError(data.error || '绑定失败');
            }
        } catch {
            setError('网络错误');
        }
        setBinding(false);
    };

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

                {/* Step: Bind Vault */}
                <div className="glass-card rounded-2xl p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center">
                            <FolderOpen className="h-4 w-4 text-violet-400" />
                        </div>
                        <div>
                            <div className="font-semibold text-sm">选择你的 Obsidian 文件夹</div>
                            <div className="text-[11px] text-muted-foreground">Meridian 将根据文件夹结构生成个性化看板</div>
                        </div>
                    </div>

                    {/* Native Folder Picker */}
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
                                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">点击选择 Obsidian 文件夹</span>
                            </>
                        )}
                    </button>

                    {error && <p className="text-xs text-red-400">{error}</p>}

                    <button
                        onClick={handleBind}
                        disabled={binding || !vaultPath.trim()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {binding ? (
                            <span>绑定中...</span>
                        ) : (
                            <>
                                <span>开始使用</span>
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </div>

                {/* Features preview */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { emoji: '🤖', text: 'Agent 指令' },
                        { emoji: '🧩', text: 'Skills 库' },
                        { emoji: '📊', text: '用量分析' },
                    ].map((f) => (
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
