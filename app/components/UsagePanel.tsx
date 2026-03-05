'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Cpu, Zap, Clock, ArrowUpRight, ArrowDownLeft, Database, Loader2 } from 'lucide-react';

interface UsageData {
    totalSessions: number;
    totalInput: number;
    totalOutput: number;
    totalCacheCreate: number;
    totalCacheRead: number;
    totalTokens: number;
    models: Record<string, number>;
    recentSessions: {
        sessionId: string;
        firstPrompt: string;
        model: string;
        inputTokens: number;
        outputTokens: number;
        cacheCreationTokens: number;
        cacheReadTokens: number;
        messageCount: number;
        created: string;
        modified: string;
    }[];
}

function formatNum(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
}

function formatDate(d: string): string {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' ' +
        date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

export function UsagePanel() {
    const [data, setData] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/usage')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="glass-card rounded-2xl p-5 text-center text-muted-foreground text-sm">
                无法加载用量数据
            </div>
        );
    }

    const modelEntries = Object.entries(data.models).sort((a, b) => b[1] - a[1]);

    return (
        <div className="space-y-5 stagger-children">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: '总会话数', value: data.totalSessions, icon: Clock, color: 'text-violet-400' },
                    { label: '总 Tokens', value: formatNum(data.totalTokens), icon: Zap, color: 'text-amber-400' },
                    { label: '输入 Tokens', value: formatNum(data.totalInput), icon: ArrowUpRight, color: 'text-blue-400' },
                    { label: '输出 Tokens', value: formatNum(data.totalOutput), icon: ArrowDownLeft, color: 'text-emerald-400' },
                ].map((s) => (
                    <div key={s.label} className="glass-card rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <s.icon className={`h-4 w-4 ${s.color}`} />
                            <span className="text-[10px] text-muted-foreground">{s.label}</span>
                        </div>
                        <div className="stat-value text-2xl">{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Cache Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="glass-card rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Database className="h-4 w-4 text-violet-400" />
                        <span className="text-[10px] text-muted-foreground">缓存创建 Tokens</span>
                    </div>
                    <div className="stat-value text-2xl">{formatNum(data.totalCacheCreate)}</div>
                </div>
                <div className="glass-card rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Database className="h-4 w-4 text-emerald-400" />
                        <span className="text-[10px] text-muted-foreground">缓存读取 Tokens</span>
                    </div>
                    <div className="stat-value text-2xl">{formatNum(data.totalCacheRead)}</div>
                </div>
            </div>

            {/* Model Distribution */}
            <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Cpu className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-medium">模型使用分布</span>
                    <span className="text-xs text-muted-foreground ml-auto">{modelEntries.length} 个模型</span>
                </div>
                <div className="space-y-2">
                    {modelEntries.map(([model, count]) => {
                        const totalSessions = data.totalSessions || 1;
                        const pct = Math.round((count / totalSessions) * 100);
                        return (
                            <div key={model}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="font-mono truncate max-w-[200px]">{model}</span>
                                    <span className="text-muted-foreground">{count} 次 ({pct}%)</span>
                                </div>
                                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 rounded-full transition-all"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Sessions */}
            <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-medium">最近会话</span>
                    <span className="text-xs text-muted-foreground ml-auto">最近 {data.recentSessions.length} 个</span>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {data.recentSessions.map((s) => (
                        <div key={s.sessionId} className="p-3 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">{s.model || 'unknown'}</span>
                                <span className="text-[10px] text-muted-foreground">{formatDate(s.modified)}</span>
                            </div>
                            <p className="text-xs truncate mb-1.5">{s.firstPrompt || '(no prompt)'}</p>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                <span>📨 {s.messageCount} 消息</span>
                                <span>⬆ {formatNum(s.inputTokens)}</span>
                                <span>⬇ {formatNum(s.outputTokens)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
