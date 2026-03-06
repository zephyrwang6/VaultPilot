'use client';

import { useState, useEffect } from 'react';
import { Folder, ChevronDown, ChevronRight, ExternalLink, Wand2, Eye, FolderOpen, Terminal, Copy, Check, Send } from 'lucide-react';
import type { AgentType, VaultFolder } from '@/lib/types';
import { FolderAnalysisModal } from './FolderAnalysisModal';

interface FoldersPanelProps {
    vaultPath: string;
    agentType: AgentType;
}

type ModalType = 'overview' | 'content' | 'review' | 'log';

function launchAgent(command: string, agentType: AgentType) {
    if (agentType === 'openclaw') {
        fetch('/api/openclaw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: command }),
        });
    } else {
        fetch('/api/claude', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command }),
        });
    }
}

function openInFinder(path: string) {
    fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, action: 'finder' }),
    });
}

function openInTerminal(path: string) {
    fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, action: 'terminal' }),
    });
}

export function FoldersPanel({ vaultPath, agentType }: FoldersPanelProps) {
    const [structure, setStructure] = useState<VaultFolder[]>([]);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [modal, setModal] = useState<{ type: ModalType; path: string; name: string } | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const isOpenClaw = agentType === 'openclaw';

    const copyPath = (path: string) => {
        navigator.clipboard.writeText(path);
        setCopied(path);
        setTimeout(() => setCopied(null), 1500);
    };

    useEffect(() => {
        fetch('/api/vault')
            .then(r => r.json())
            .then(data => { if (data.structure) setStructure(data.structure); })
            .catch(() => { });
    }, [vaultPath]);

    const toggle = (p: string) => {
        const next = new Set(expanded);
        next.has(p) ? next.delete(p) : next.add(p);
        setExpanded(next);
    };

    const openModal = (type: ModalType, folder: VaultFolder) => {
        setModal({ type, path: folder.path, name: folder.name });
    };

    const folderActions = (folder: VaultFolder) => [
        { label: '📊 总览分析', type: 'overview' as ModalType },
        { label: '📝 创作模块', type: 'content' as ModalType },
        { label: '🔄 复盘模块', type: 'review' as ModalType },
        { label: '📋 日志模块', type: 'log' as ModalType },
    ];

    const globalActions = [
        {
            label: '创建总览导航',
            cmd: '使用 meridian Skill。一次只创建一个面板。参考 05 工具箱/obsidian-dashboard/my-app/app/components/desktop/OverviewPanel.tsx 的设计风格，在 05 工具箱/vault-pilot/app/components/ 下创建 OverviewPanel.tsx，用于分析所有文件夹的数据概况：各文件夹文件数和大小统计、最近修改的文件、本周活跃度。使用 Meridian 的 glass-card 样式。在 page.tsx 中注册为左侧导航项「总览」。',
            icon: '📊',
        },
        {
            label: '创建内容创作导航',
            cmd: '使用 meridian Skill。一次只创建一个面板。参考 05 工具箱/obsidian-dashboard/my-app/app/components/desktop/ContentPanel.tsx 的设计风格，在 05 工具箱/vault-pilot/app/components/ 下创建 ContentPanel.tsx，读取 01 内容创作/ 下的独立文章和专栏文章列表（从文件名提取标题和日期），展示文章数量统计和最近文章。使用 Meridian 的 glass-card 样式。在 page.tsx 中注册为左侧导航项「创作」。',
            icon: '📝',
        },
        {
            label: '创建计划导航',
            cmd: '使用 meridian Skill。一次只创建一个面板。参考 05 工具箱/obsidian-dashboard/my-app/app/components/desktop/GoalsPanel.tsx 的设计风格，在 05 工具箱/vault-pilot/app/components/ 下创建 PlanningPanel.tsx，读取 06 计划/ 下的周计划和每日记录（daily_log.jsonl），展示本周计划内容和每日完成情况。使用 Meridian 的 glass-card 样式。在 page.tsx 中注册为左侧导航项「计划」。',
            icon: '📅',
        },
        {
            label: '创建复盘导航',
            cmd: '使用 meridian Skill。一次只创建一个面板。参考 05 工具箱/obsidian-dashboard/my-app/app/components/desktop/ReviewPanel.tsx 的设计风格，在 05 工具箱/vault-pilot/app/components/ 下创建 ReviewPanel.tsx，读取 06 计划/05 周复盘/ 和 goals_tracker.jsonl，展示本周产出统计（文章/视频/动态的进度条）和最近的复盘报告。使用 Meridian 的 glass-card 样式。在 page.tsx 中注册为左侧导航项「复盘」。',
            icon: '🔄',
        },
    ];

    const renderFolder = (folder: VaultFolder, depth = 0) => {
        const isExpanded = expanded.has(folder.path);
        return (
            <div key={folder.path}>
                <div
                    className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-secondary/30 transition-colors group"
                    style={{ paddingLeft: 8 + depth * 16 }}
                >
                    <button onClick={() => toggle(folder.path)} className="shrink-0">
                        {folder.children.length > 0 || true ? (
                            isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : <span className="w-3.5" />}
                    </button>
                    <Folder className="h-4 w-4 text-violet-400 shrink-0" />
                    <span className="text-sm flex-1 truncate">{folder.name}</span>
                    <span className="text-[10px] text-muted-foreground mr-1">{folder.fileCount} 项</span>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                        {[
                            { icon: FolderOpen, label: '访达', color: 'hover:text-blue-400 hover:bg-blue-500/10', onClick: () => openInFinder(folder.path) },
                            { icon: Terminal, label: '终端', color: 'hover:text-emerald-400 hover:bg-emerald-500/10', onClick: () => openInTerminal(folder.path) },
                            { icon: copied === folder.path ? Check : Copy, label: copied === folder.path ? '已复制' : '复制', color: copied === folder.path ? 'text-emerald-400 bg-emerald-500/10' : 'hover:text-amber-400 hover:bg-amber-500/10', onClick: () => copyPath(folder.path) },
                            { icon: Eye, label: '分析', color: 'hover:text-violet-400 hover:bg-violet-500/10', onClick: () => openModal('overview', folder) },
                        ].map(btn => (
                            <button
                                key={btn.label}
                                onClick={(e) => { e.stopPropagation(); btn.onClick(); }}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-muted-foreground transition-colors text-[10px] ${btn.color}`}
                            >
                                <btn.icon className="h-3 w-3" />
                                <span>{btn.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {isExpanded && (
                    <div className="ml-12 mb-2 space-y-0.5">
                        {folderActions(folder).map((a) => (
                            <button
                                key={a.label}
                                onClick={() => openModal(a.type, folder)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors text-left group/action"
                            >
                                <span>{a.label}</span>
                                <Eye className="h-3 w-3 ml-auto shrink-0 opacity-0 group-hover/action:opacity-100 transition-opacity" />
                            </button>
                        ))}
                        {folder.children.map(c => renderFolder(c, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <div className="space-y-5 stagger-children">
                {/* Quick Actions */}
                <div className="glass-card rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Wand2 className="h-4 w-4 text-violet-400" />
                        <span className="text-sm font-medium">快捷指令</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                            发送到 {isOpenClaw ? 'OpenClaw' : 'Claude Code'}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {globalActions.map((a) => (
                            <button
                                key={a.label}
                                onClick={() => launchAgent(a.cmd, agentType)}
                                className="action-btn py-3 text-left gap-3"
                            >
                                <span className="text-lg">{a.icon}</span>
                                <span className="text-xs flex-1">{a.label}</span>
                                {isOpenClaw
                                    ? <Send className="h-3 w-3 text-muted-foreground shrink-0" />
                                    : <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                                }
                            </button>
                        ))}
                    </div>
                </div>

                {/* Folder Tree */}
                <div className="glass-card rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Folder className="h-4 w-4 text-violet-400" />
                        <span className="text-sm font-medium">Vault 文件夹</span>
                        <span className="text-xs text-muted-foreground ml-auto">{structure.length} 个顶层目录</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-3">
                        展开文件夹查看分析模块 · 悬停显示 <Eye className="inline h-3 w-3" /> 快速查看分析
                    </p>
                    <div className="max-h-[500px] overflow-y-auto">
                        {structure.map(f => renderFolder(f))}
                    </div>
                </div>
            </div>

            {modal && (
                <FolderAnalysisModal
                    type={modal.type}
                    folderPath={modal.path}
                    folderName={modal.name}
                    onClose={() => setModal(null)}
                />
            )}
        </>
    );
}
