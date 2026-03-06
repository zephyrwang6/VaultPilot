'use client';

import { useState, useEffect } from 'react';
import {
    X, RefreshCw, Loader2, FileText, Folder, Clock, HardDrive,
    BarChart3, Eye, TrendingUp, Calendar, ArrowUpRight
} from 'lucide-react';

interface FolderStats {
    folderName: string;
    folderPath: string;
    totalFiles: number;
    totalFolders: number;
    totalSize: number;
    filesByType: Record<string, number>;
    recentFiles: { name: string; ext: string; size: number; modifiedAt: string }[];
    largestFiles: { name: string; ext: string; size: number; modifiedAt: string }[];
    folderSizes: { name: string; fileCount: number; size: number }[];
    modifiedToday: number;
    modifiedThisWeek: number;
    modifiedThisMonth: number;
}

type ModalType = 'overview' | 'content' | 'review' | 'log';

interface FolderModalProps {
    type: ModalType;
    folderPath: string;
    folderName: string;
    onClose: () => void;
}

const typeConfig: Record<ModalType, { title: string; icon: string; color: string }> = {
    overview: { title: '总览分析', icon: '📊', color: 'violet' },
    content: { title: '创作模块', icon: '📝', color: 'blue' },
    review: { title: '复盘模块', icon: '🔄', color: 'emerald' },
    log: { title: '日志模块', icon: '📋', color: 'amber' },
};

function formatSize(bytes: number): string {
    if (bytes >= 1_000_000) return (bytes / 1_000_000).toFixed(1) + ' MB';
    if (bytes >= 1_000) return (bytes / 1_000).toFixed(1) + ' KB';
    return bytes + ' B';
}

function formatDate(d: string): string {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
    if (diff < 604800000) return Math.floor(diff / 86400000) + ' 天前';
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

const extColors: Record<string, string> = {
    md: 'bg-violet-500', json: 'bg-blue-500', jsonl: 'bg-blue-400',
    ts: 'bg-emerald-500', tsx: 'bg-emerald-400', js: 'bg-amber-500',
    css: 'bg-pink-500', png: 'bg-rose-400', jpg: 'bg-rose-400',
    other: 'bg-gray-400',
};

// ─── Visual Bar ───
function Bar({ value, max, color = 'violet' }: { value: number; max: number; color?: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    const colorMap: Record<string, string> = {
        violet: 'from-violet-500 to-indigo-400',
        blue: 'from-blue-500 to-cyan-400',
        emerald: 'from-emerald-500 to-teal-400',
        amber: 'from-amber-500 to-yellow-400',
    };
    return (
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
                className={`h-full bg-gradient-to-r ${colorMap[color] || colorMap.violet} rounded-full transition-all duration-500`}
                style={{ width: `${Math.max(pct, 2)}%` }}
            />
        </div>
    );
}

// ─── Overview Tab ───
function OverviewView({ data }: { data: FolderStats }) {
    const maxTypeCount = Math.max(...Object.values(data.filesByType), 1);
    const maxFolderFiles = Math.max(...data.folderSizes.map(f => f.fileCount), 1);

    return (
        <div className="space-y-5">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: '文件总数', value: data.totalFiles, icon: FileText, color: 'text-violet-400' },
                    { label: '文件夹', value: data.totalFolders, icon: Folder, color: 'text-blue-400' },
                    { label: '总大小', value: formatSize(data.totalSize), icon: HardDrive, color: 'text-emerald-400' },
                    { label: '本月更新', value: data.modifiedThisMonth, icon: Calendar, color: 'text-amber-400' },
                ].map(s => (
                    <div key={s.label} className="glass-card rounded-xl p-3">
                        <s.icon className={`h-4 w-4 ${s.color} mb-1`} />
                        <div className="stat-value text-xl">{s.value}</div>
                        <div className="text-[10px] text-muted-foreground">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Activity Timeline */}
            <div className="glass-card rounded-xl p-4">
                <div className="text-xs font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-violet-400" />
                    活跃度
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: '今日', value: data.modifiedToday, color: 'emerald' },
                        { label: '本周', value: data.modifiedThisWeek, color: 'blue' },
                        { label: '本月', value: data.modifiedThisMonth, color: 'violet' },
                    ].map(t => (
                        <div key={t.label}>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                                <span>{t.label}</span><span>{t.value} 文件</span>
                            </div>
                            <Bar value={t.value} max={data.totalFiles} color={t.color} />
                        </div>
                    ))}
                </div>
            </div>

            {/* File Type Distribution */}
            <div className="glass-card rounded-xl p-4">
                <div className="text-xs font-medium mb-3 flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5 text-violet-400" />
                    文件类型分布
                </div>
                <div className="space-y-2">
                    {Object.entries(data.filesByType).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([ext, count]) => (
                        <div key={ext}>
                            <div className="flex items-center justify-between text-[10px] mb-1">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${extColors[ext] || extColors.other}`} />
                                    <span className="font-mono">.{ext}</span>
                                </div>
                                <span className="text-muted-foreground">{count} 个 ({Math.round(count / data.totalFiles * 100)}%)</span>
                            </div>
                            <Bar value={count} max={maxTypeCount} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Subfolder Comparison */}
            {data.folderSizes.length > 0 && (
                <div className="glass-card rounded-xl p-4">
                    <div className="text-xs font-medium mb-3 flex items-center gap-2">
                        <Folder className="h-3.5 w-3.5 text-violet-400" />
                        子文件夹对比
                    </div>
                    <div className="space-y-2">
                        {data.folderSizes.map(f => (
                            <div key={f.name}>
                                <div className="flex items-center justify-between text-[10px] mb-1">
                                    <span className="truncate max-w-[200px]">{f.name}</span>
                                    <span className="text-muted-foreground">{f.fileCount} 文件 · {formatSize(f.size)}</span>
                                </div>
                                <Bar value={f.fileCount} max={maxFolderFiles} color="blue" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Content Tab (创作模块) ───
function ContentView({ data }: { data: FolderStats }) {
    const mdFiles = data.recentFiles.filter(f => f.ext === 'md');
    const nonMd = data.recentFiles.filter(f => f.ext !== 'md');

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
                <div className="glass-card rounded-xl p-3 text-center">
                    <div className="stat-value text-xl">{data.filesByType['md'] || 0}</div>
                    <div className="text-[10px] text-muted-foreground">Markdown 文件</div>
                </div>
                <div className="glass-card rounded-xl p-3 text-center">
                    <div className="stat-value text-xl">{data.modifiedThisWeek}</div>
                    <div className="text-[10px] text-muted-foreground">本周更新</div>
                </div>
                <div className="glass-card rounded-xl p-3 text-center">
                    <div className="stat-value text-xl">{formatSize(data.totalSize)}</div>
                    <div className="text-[10px] text-muted-foreground">内容总量</div>
                </div>
            </div>
            <div className="glass-card rounded-xl p-4">
                <div className="text-xs font-medium mb-3">📝 最近编辑的内容</div>
                <div className="space-y-1.5">
                    {data.recentFiles.slice(0, 12).map(f => (
                        <div key={f.name + f.modifiedAt} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-secondary/20">
                            <span className={`w-1.5 h-1.5 rounded-full ${extColors[f.ext] || extColors.other}`} />
                            <span className="text-xs flex-1 truncate">{f.name}</span>
                            <span className="text-[10px] text-muted-foreground">{formatSize(f.size)}</span>
                            <span className="text-[10px] text-muted-foreground">{formatDate(f.modifiedAt)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Review Tab (复盘模块) ───
function ReviewView({ data }: { data: FolderStats }) {
    const total = data.totalFiles;
    const recent = data.modifiedThisMonth;
    const stale = total - recent;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
                <div className="glass-card rounded-xl p-4 text-center">
                    <div className="stat-value text-2xl text-emerald-400">{recent}</div>
                    <div className="text-[10px] text-muted-foreground">本月活跃文件</div>
                    <div className="mt-1"><Bar value={recent} max={total} color="emerald" /></div>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                    <div className="stat-value text-2xl text-muted-foreground">{stale}</div>
                    <div className="text-[10px] text-muted-foreground">超过 30 天未动</div>
                    <div className="mt-1"><Bar value={stale} max={total} color="amber" /></div>
                </div>
            </div>
            <div className="glass-card rounded-xl p-4">
                <div className="text-xs font-medium mb-3">🏆 最大文件 (内容最丰富)</div>
                <div className="space-y-1.5">
                    {data.largestFiles.map((f, i) => (
                        <div key={f.name} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-secondary/20">
                            <span className="text-[10px] text-muted-foreground w-5">{i + 1}.</span>
                            <span className="text-xs flex-1 truncate">{f.name}</span>
                            <span className="text-[10px] font-mono text-violet-400">{formatSize(f.size)}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="glass-card rounded-xl p-4">
                <div className="text-xs font-medium mb-3">📊 子文件夹产出量</div>
                <div className="space-y-2">
                    {data.folderSizes.slice(0, 10).map(f => (
                        <div key={f.name}>
                            <div className="flex justify-between text-[10px] mb-1">
                                <span>{f.name}</span><span className="text-muted-foreground">{f.fileCount} 文件</span>
                            </div>
                            <Bar value={f.fileCount} max={data.folderSizes[0]?.fileCount || 1} color="emerald" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Log Tab (日志模块) ───
function LogView({ data }: { data: FolderStats }) {
    // Group recent files by date
    const grouped: Record<string, typeof data.recentFiles> = {};
    for (const f of data.recentFiles) {
        const day = new Date(f.modifiedAt).toLocaleDateString('zh-CN');
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(f);
    }

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
                <div className="glass-card rounded-xl p-3 text-center">
                    <div className="stat-value text-xl text-emerald-400">{data.modifiedToday}</div>
                    <div className="text-[10px] text-muted-foreground">今日变动</div>
                </div>
                <div className="glass-card rounded-xl p-3 text-center">
                    <div className="stat-value text-xl text-blue-400">{data.modifiedThisWeek}</div>
                    <div className="text-[10px] text-muted-foreground">本周变动</div>
                </div>
                <div className="glass-card rounded-xl p-3 text-center">
                    <div className="stat-value text-xl text-violet-400">{data.modifiedThisMonth}</div>
                    <div className="text-[10px] text-muted-foreground">本月变动</div>
                </div>
            </div>
            <div className="glass-card rounded-xl p-4">
                <div className="text-xs font-medium mb-3">📋 文件变动日志</div>
                <div className="space-y-4 max-h-[350px] overflow-y-auto">
                    {Object.entries(grouped).map(([day, files]) => (
                        <div key={day}>
                            <div className="text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                <Calendar className="h-3 w-3" />
                                {day}
                                <span className="ml-auto">{files.length} 个文件</span>
                            </div>
                            <div className="space-y-1 ml-4 border-l border-border/50 pl-3">
                                {files.map(f => (
                                    <div key={f.name + f.modifiedAt} className="flex items-center gap-2 py-1">
                                        <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                                        <span className="text-xs flex-1 truncate">{f.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{new Date(f.modifiedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Main Modal ───
export function FolderAnalysisModal({ type, folderPath, folderName, onClose }: FolderModalProps) {
    const [data, setData] = useState<FolderStats | null>(null);
    const [loading, setLoading] = useState(true);
    const config = typeConfig[type];

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/folder-analysis?path=${encodeURIComponent(folderPath)}`);
            const d = await res.json();
            if (!d.error) setData(d);
        } catch { /* skip */ }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [folderPath]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl bg-popover border border-border overflow-hidden flex flex-col animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">{config.icon}</span>
                        <div>
                            <div className="font-semibold text-sm">{folderName} — {config.title}</div>
                            <div className="text-[10px] text-muted-foreground truncate max-w-[300px]">{folderPath}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            title="刷新数据"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-3 text-sm text-muted-foreground">正在分析 {folderName}...</span>
                        </div>
                    ) : data ? (
                        <>
                            {type === 'overview' && <OverviewView data={data} />}
                            {type === 'content' && <ContentView data={data} />}
                            {type === 'review' && <ReviewView data={data} />}
                            {type === 'log' && <LogView data={data} />}
                        </>
                    ) : (
                        <div className="text-center py-16 text-sm text-muted-foreground">
                            无法加载分析数据
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
