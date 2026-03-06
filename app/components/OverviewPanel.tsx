'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  FolderOpen,
  FileText,
  Clock,
  Activity,
  HardDrive,
  TrendingUp,
  BarChart3,
  MoreHorizontal,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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

// 获取问候语
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

export function OverviewPanel({ vaultPath }: OverviewPanelProps) {
  const [stats, setStats] = useState<FolderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setGreeting(getGreeting());
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
  const vaultName = vaultPath.split('/').pop() || 'Vault';

  // 顶部统计卡片数据
  const statCards = [
    {
      icon: FileText,
      label: '总文件数',
      value: stats.totalFiles.toLocaleString(),
      color: 'from-blue-400 to-indigo-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: HardDrive,
      label: '总大小',
      value: formatSize(stats.totalSize),
      color: 'from-green-400 to-teal-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      icon: TrendingUp,
      label: '本周活跃',
      value: stats.modifiedThisWeek.toString(),
      color: 'from-purple-400 to-pink-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      icon: Activity,
      label: '今日修改',
      value: stats.modifiedToday.toString(),
      color: 'from-orange-400 to-red-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
  ];

  return (
    <div className="h-full overflow-y-auto stagger-children">
      <div className="max-w-5xl mx-auto px-2 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {greeting}，Zephyr
          </h1>
          <p className="text-sm text-muted-foreground">
            📁 {vaultName} · 共 {stats.totalFolders} 个文件夹
          </p>
        </div>

        {/* 顶部统计卡片 - 使用 glass-card 样式 */}
        <section className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((card, idx) => (
              <div
                key={idx}
                className="glass-card rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center shrink-0`}>
                    <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</div>
                    <div className="text-xs text-muted-foreground">{card.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 主体两栏 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 文件夹分布 */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <FolderOpen className="w-4 h-4" />
                <span className="text-sm font-medium">文件夹概况</span>
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-gray-400">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
            <div className="glass-card rounded-2xl p-5">
              <div className="space-y-3">
                {stats.folderSizes.slice(0, 10).map(folder => (
                  <div key={folder.name} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs truncate max-w-[55%] text-foreground/80" title={folder.name}>
                        {folder.name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[10px] text-muted-foreground">{formatSize(folder.size)}</span>
                        <span className="text-[10px] font-medium text-violet-400">{folder.fileCount} 个</span>
                      </div>
                    </div>
                    <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500 group-hover:from-violet-400 group-hover:to-indigo-400"
                        style={{ width: `${(folder.fileCount / maxFileCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 最近修改文件 */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">最近修改</span>
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-gray-400">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
            <div className="glass-card rounded-2xl p-5">
              <div className="space-y-1">
                {stats.recentFiles.slice(0, 8).map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/30 transition-colors cursor-default group"
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
          </section>
        </div>

        {/* 本周活跃度 */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">本周活跃度</span>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-gray-400">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: '今日',
                  value: stats.modifiedToday,
                  color: 'from-orange-500 to-amber-400',
                  max: Math.max(stats.modifiedThisWeek, 1),
                  icon: Zap,
                },
                {
                  label: '本周',
                  value: stats.modifiedThisWeek,
                  color: 'from-violet-500 to-indigo-500',
                  max: Math.max(stats.modifiedThisMonth, 1),
                  icon: TrendingUp,
                },
                {
                  label: '本月',
                  value: stats.modifiedThisMonth,
                  color: 'from-blue-500 to-cyan-400',
                  max: Math.max(stats.totalFiles, 1),
                  icon: Activity,
                },
              ].map(item => (
                <div key={item.label} className="bg-secondary/20 rounded-xl p-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{item.label}</span>
                  </div>
                  <div className="text-2xl font-bold gradient-text mb-3">{item.value}</div>
                  <div className="h-2 bg-secondary/40 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-2">/ {item.max} 个文件</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
