'use client';

import { useState, useEffect } from 'react';
import {
    BarChart3, MessageSquare, Clock, Zap, RefreshCw, Loader2,
    Calendar, ArrowUpRight, ArrowDownRight, Cpu
} from 'lucide-react';

interface ModelUsage {
    inputTokens: number;
    outputTokens: number;
    cacheReadInputTokens: number;
    cacheCreationInputTokens: number;
    costUSD: number;
}

interface DailyActivity {
    date: string;
    messageCount: number;
    sessionCount: number;
    toolCallCount: number;
}

interface DailyModelTokens {
    date: string;
    tokensByModel: Record<string, number>;
}

interface UsageData {
    dailyActivity: DailyActivity[];
    dailyModelTokens: DailyModelTokens[];
    modelUsage: Record<string, ModelUsage>;
    totalSessions: number;
    totalMessages: number;
    firstSessionDate: string;
    lastComputedDate: string;
    hourCounts: Record<string, number>;
}

type TimeRange = '7d' | '30d' | 'all';

function formatNum(n: number): string {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return String(n);
}

function Bar({ value, max, color = 'violet' }: { value: number; max: number; color?: string }) {
    const pct = max > 0 ? Math.max((value / max) * 100, 1) : 0;
    const map: Record<string, string> = {
        violet: 'from-violet-500 to-indigo-400',
        blue: 'from-blue-500 to-cyan-400',
        emerald: 'from-emerald-500 to-teal-400',
        amber: 'from-amber-500 to-yellow-400',
        rose: 'from-rose-500 to-pink-400',
    };
    return (
        <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
            <div
                className={`h-full bg-gradient-to-r ${map[color] || map.violet} rounded-full transition-all duration-500`}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

// Mini bar chart for daily activity
function DailyChart({ data, field, color }: { data: DailyActivity[]; field: keyof DailyActivity; color: string }) {
    const vals = data.map(d => Number(d[field]));
    const max = Math.max(...vals, 1);
    return (
        <div className="flex items-end gap-[2px] h-12">
            {data.map((d, i) => {
                const h = (Number(d[field]) / max) * 100;
                return (
                    <div
                        key={d.date}
                        className={`flex-1 min-w-[3px] max-w-[12px] rounded-t bg-gradient-to-t ${color} opacity-70 hover:opacity-100 transition-opacity cursor-default`}
                        style={{ height: `${Math.max(h, 3)}%` }}
                        title={`${d.date}: ${d[field]}`}
                    />
                );
            })}
        </div>
    );
}

export function UsagePanel() {
    const [data, setData] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<TimeRange>('30d');

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/usage');
            const d = await res.json();
            if (!d.error) setData(d);
        } catch { /* skip */ }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
    );

    if (!data) return <div className="text-center py-20 text-muted-foreground text-sm">无法加载用量数据</div>;

    // Filter by time range
    const now = new Date();
    const filtered = data.dailyActivity.filter(d => {
        if (range === 'all') return true;
        const days = range === '7d' ? 7 : 30;
        return (now.getTime() - new Date(d.date).getTime()) < days * 86400000;
    });

    const rangeMessages = filtered.reduce((s, d) => s + d.messageCount, 0);
    const rangeSessions = filtered.reduce((s, d) => s + d.sessionCount, 0);
    const rangeTools = filtered.reduce((s, d) => s + d.toolCallCount, 0);

    // Model data
    const models = Object.entries(data.modelUsage)
        .map(([name, usage]) => ({
            name,
            total: usage.inputTokens + usage.outputTokens + usage.cacheReadInputTokens + usage.cacheCreationInputTokens,
            ...usage,
        }))
        .sort((a, b) => b.total - a.total);
    const maxModelTokens = models[0]?.total || 1;

    // Hourly activity
    const hours = data.hourCounts;
    const maxHour = Math.max(...Object.values(hours), 1);

    return (
        <div className="space-y-5 stagger-children">
            {/* Header with time range + refresh */}
            <div className="flex items-center gap-2">
                <div className="flex gap-1 bg-secondary/30 rounded-lg p-0.5">
                    {[
                        { key: '7d', label: '7天' },
                        { key: '30d', label: '30天' },
                        { key: 'all', label: '全部' },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => setRange(t.key as TimeRange)}
                            className={`px-3 py-1 rounded-md text-[11px] transition-colors ${range === t.key ? 'bg-violet-500/20 text-violet-400 font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <span className="text-[10px] text-muted-foreground ml-auto">
                    首次使用 {data.firstSessionDate ? new Date(data.firstSessionDate).toLocaleDateString('zh-CN') : '-'}
                </span>
                <button onClick={loadData} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
                    <RefreshCw className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: '总会话', value: data.totalSessions, rangeVal: rangeSessions, icon: MessageSquare, color: 'text-violet-400' },
                    { label: '总消息', value: data.totalMessages, rangeVal: rangeMessages, icon: Zap, color: 'text-blue-400' },
                    { label: '工具调用', value: data.dailyActivity.reduce((s, d) => s + d.toolCallCount, 0), rangeVal: rangeTools, icon: ArrowUpRight, color: 'text-emerald-400' },
                    { label: '使用模型', value: models.length, rangeVal: undefined, icon: Cpu, color: 'text-amber-400' },
                ].map(s => (
                    <div key={s.label} className="glass-card rounded-xl p-3">
                        <s.icon className={`h-4 w-4 ${s.color} mb-1`} />
                        <div className="stat-value text-xl">{formatNum(s.value)}</div>
                        <div className="text-[10px] text-muted-foreground">{s.label}</div>
                        {s.rangeVal !== undefined && (
                            <div className="text-[9px] text-muted-foreground/60 mt-0.5">
                                {range === '7d' ? '7天' : range === '30d' ? '30天' : '全部'}: {formatNum(s.rangeVal)}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Daily Activity Chart */}
            <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-medium">每日活动</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{filtered.length} 天</span>
                </div>
                <div className="space-y-3">
                    <div>
                        <div className="text-[10px] text-muted-foreground mb-1">消息量</div>
                        <DailyChart data={filtered} field="messageCount" color="from-violet-500 to-indigo-400" />
                    </div>
                    <div>
                        <div className="text-[10px] text-muted-foreground mb-1">工具调用</div>
                        <DailyChart data={filtered} field="toolCallCount" color="from-emerald-500 to-teal-400" />
                    </div>
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground/50 mt-1">
                    <span>{filtered[0]?.date || ''}</span>
                    <span>{filtered[filtered.length - 1]?.date || ''}</span>
                </div>
            </div>

            {/* Model Usage */}
            <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Cpu className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-medium">模型使用分布</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{models.length} 个模型</span>
                </div>
                <div className="space-y-3">
                    {models.map(m => (
                        <div key={m.name}>
                            <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="font-mono truncate max-w-[200px]">{m.name}</span>
                                <span className="text-muted-foreground">{formatNum(m.total)} tokens</span>
                            </div>
                            <Bar value={m.total} max={maxModelTokens} color={m.name.includes('opus') ? 'rose' : m.name.includes('sonnet') ? 'violet' : 'blue'} />
                            <div className="flex gap-3 mt-0.5 text-[9px] text-muted-foreground/60">
                                <span>输入 {formatNum(m.inputTokens)}</span>
                                <span>输出 {formatNum(m.outputTokens)}</span>
                                <span>缓存读取 {formatNum(m.cacheReadInputTokens)}</span>
                                {m.cacheCreationInputTokens > 0 && <span>缓存创建 {formatNum(m.cacheCreationInputTokens)}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Hourly Activity */}
            {Object.keys(hours).length > 0 && (
                <div className="glass-card rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-violet-400" />
                        <span className="text-sm font-medium">活跃时段</span>
                    </div>
                    <div className="flex items-end gap-1 h-12">
                        {Array.from({ length: 24 }, (_, i) => {
                            const count = hours[String(i)] || 0;
                            const h = (count / maxHour) * 100;
                            return (
                                <div
                                    key={i}
                                    className={`flex-1 rounded-t transition-opacity cursor-default ${count > 0 ? 'bg-gradient-to-t from-violet-500 to-indigo-400 opacity-70 hover:opacity-100' : 'bg-secondary/30'}`}
                                    style={{ height: `${Math.max(h, 4)}%` }}
                                    title={`${i}:00 — ${count} 次`}
                                />
                            );
                        })}
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground/50 mt-1">
                        <span>0:00</span>
                        <span>6:00</span>
                        <span>12:00</span>
                        <span>18:00</span>
                        <span>23:00</span>
                    </div>
                </div>
            )}
        </div>
    );
}
