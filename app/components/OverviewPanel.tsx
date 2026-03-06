'use client';

import { useState, useEffect } from 'react';
import { Loader2, FolderOpen, FileText, Clock, Activity, HardDrive, TrendingUp } from 'lucide-react';

interface FileInfo {
  name: string;
  ext: string;
  size: number;
  modifiedAt: string;
  isDir: boolean;
}

interface FolderStats {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  recentFiles: FileInfo[];
  folderSizes: { name: string; fileCount: number; size: number }[];
  modifiedToday: number;
  modifiedThisWeek: number;
  modifiedThisMonth: number;
}

interface OverviewPanelProps {
  vaultPath: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return new Date(iso).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

function getFileIcon(ext: string): string {
  if (ext === 'md') return '📝';
  if (ext === 'json' || ext === 'jsonl') return '📋';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return '🖼️';
  if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) return '⚡';
  if (ext === 'pdf') return '📄';
  if (ext === 'canvas') return '🎨';
  return '📎';
}

export function OverviewPanel({ vaultPath }: OverviewPanelProps) {
  const [stats, setStats] = useState<FolderStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/folder-analysis?path=${encodeURIComponent(vaultPath)}`)
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [vaultPath]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-16 text-muted-foreground text-sm">加载失败，请检查 Vault 路径</div>;
  }

  const maxFileCount = Math.max(...stats.folderSizes.map(f => f.fileCount), 1);

  return (
    <div className="space-y-5 stagger-children">

      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-violet-400" />
            <span className="text-[10px] text-muted-foreground">总文件数</span>
          </div>
          <div className="stat-value text-2xl">{stats.totalFiles.toLocaleString()}</div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="h-4 w-4 text-blue-400" />
            <span className="text-[10px] text-muted-foreground">总大小</span>
          </div>
          <div className="stat-value text-2xl">{formatSize(stats.totalSize)}</div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-[10px] text-muted-foreground">本周活跃</span>
          </div>
          <div className="stat-value text-2xl">{stats.modifiedThisWeek}</div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-orange-400" />
            <span className="text-[10px] text-muted-foreground">今日修改</span>
          </div>
          <div className="stat-value text-2xl">{stats.modifiedToday}</div>
        </div>
      </div>

      {/* 主体两栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* 文件夹分布 */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-medium">文件夹概况</span>
          </div>
          <div className="space-y-2.5">
            {stats.folderSizes.slice(0, 12).map(folder => (
              <div key={folder.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs truncate max-w-[60%] text-foreground/80" title={folder.name}>
                    {folder.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] text-muted-foreground">{formatSize(folder.size)}</span>
                    <span className="text-[10px] font-medium text-violet-400">{folder.fileCount} 个</span>
                  </div>
                </div>
                <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${(folder.fileCount / maxFileCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 最近修改文件 */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-medium">最近修改</span>
          </div>
          <div className="space-y-1">
            {stats.recentFiles.slice(0, 10).map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/30 transition-colors cursor-default group"
              >
                <span className="text-base leading-none shrink-0">{getFileIcon(file.ext)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate text-foreground/90">{file.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">.{file.ext} · {formatSize(file.size)}</div>
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0 group-hover:text-violet-400 transition-colors">
                  {formatRelativeTime(file.modifiedAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 本周活跃度条 */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-medium">活跃度</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '今日', value: stats.modifiedToday, color: 'from-orange-500 to-amber-400', max: stats.modifiedThisWeek || 1 },
            { label: '本周', value: stats.modifiedThisWeek, color: 'from-violet-600 to-indigo-500', max: stats.modifiedThisMonth || 1 },
            { label: '本月', value: stats.modifiedThisMonth, color: 'from-blue-500 to-cyan-400', max: stats.totalFiles || 1 },
          ].map(item => (
            <div key={item.label} className="bg-secondary/20 rounded-xl p-4">
              <div className="text-[10px] text-muted-foreground mb-1">{item.label}</div>
              <div className="text-xl font-bold gradient-text mb-2">{item.value}</div>
              <div className="h-1.5 bg-secondary/40 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                  style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">/ {item.max} 个文件</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
