'use client';

import { useState, useEffect } from 'react';
import { Folder, ChevronDown, ChevronRight, ExternalLink, Terminal, Wand2 } from 'lucide-react';
import type { VaultFolder } from '@/lib/types';

interface FoldersPanelProps {
    vaultPath: string;
}

function launchClaude(command: string) {
    fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
    });
}

export function FoldersPanel({ vaultPath }: FoldersPanelProps) {
    const [structure, setStructure] = useState<VaultFolder[]>([]);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

    // Generate action commands for a folder
    const folderActions = (folder: VaultFolder) => [
        { label: '📊 创建总览分析', cmd: `请分析 "${folder.name}" 文件夹的内容结构，生成一份总览分析报告` },
        { label: '📝 创建创作模块', cmd: `根据 "${folder.name}" 文件夹的内容，帮我在 VaultPilot 中创建一个创作模块面板` },
        { label: '🔄 创建复盘模块', cmd: `根据 "${folder.name}" 文件夹为我创建一个复盘模块，分析内容产出和完成情况` },
        { label: '📋 创建日志模块', cmd: `为 "${folder.name}" 文件夹创建一个日志模块，记录文件变动和内容更新` },
    ];

    // Global commands
    const globalActions = [
        { label: '为所有文件夹创建总览分析', cmd: '请分析整个 Obsidian Vault 的文件夹结构，为每个文件夹生成简要总览分析报告', icon: '📊' },
        { label: '生成左侧导航面板配置', cmd: '分析我的 Obsidian 文件夹结构，为我生成 VaultPilot 的左侧导航面板配置，每个重要文件夹对应一个面板', icon: '🧭' },
        { label: '分析文件夹内容变动', cmd: '分析最近 7 天我的 Obsidian Vault 中哪些文件夹有内容变动，列出新增和修改的文件', icon: '📋' },
        { label: '制定本周工作计划', cmd: '基于我的 Obsidian 文件夹结构和已有内容，帮我制定本周工作计划', icon: '📅' },
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
                        {folder.children.length > 0 ? (
                            isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : <span className="w-3.5" />}
                    </button>
                    <Folder className="h-4 w-4 text-violet-400 shrink-0" />
                    <span className="text-sm flex-1 truncate">{folder.name}</span>
                    <span className="text-[10px] text-muted-foreground">{folder.fileCount} 项</span>
                </div>

                {/* Folder actions (when expanded) */}
                {isExpanded && (
                    <div className="ml-12 mb-2 space-y-1">
                        {folderActions(folder).map((a) => (
                            <button
                                key={a.label}
                                onClick={() => launchClaude(a.cmd)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors text-left"
                            >
                                <span>{a.label}</span>
                                <ExternalLink className="h-3 w-3 ml-auto shrink-0 opacity-0 group-hover:opacity-100" />
                            </button>
                        ))}
                        {/* Sub-folders */}
                        {folder.children.map(c => renderFolder(c, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-5 stagger-children">
            {/* Quick Actions */}
            <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Wand2 className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-medium">快捷指令</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">发送到 Claude Code</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {globalActions.map((a) => (
                        <button
                            key={a.label}
                            onClick={() => launchClaude(a.cmd)}
                            className="action-btn py-3 text-left gap-3"
                        >
                            <span className="text-lg">{a.icon}</span>
                            <span className="text-xs flex-1">{a.label}</span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
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
                <p className="text-[10px] text-muted-foreground mb-3">展开文件夹查看操作指令，点击后将在终端中打开 Claude Code 执行</p>
                <div className="max-h-[500px] overflow-y-auto">
                    {structure.map(f => renderFolder(f))}
                </div>
            </div>
        </div>
    );
}
