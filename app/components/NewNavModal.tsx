'use client';

import { useState } from 'react';
import { X, Send, Loader2, ExternalLink, Wand2 } from 'lucide-react';

interface NewNavModalProps {
    onClose: () => void;
}

function launchClaude(command: string) {
    fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
    });
}

const presetActions = [
    {
        label: '创建总览导航',
        description: '分析所有文件夹的数据概况',
        cmd: '使用 meridian Skill。一次只创建一个面板。参考 05 工具箱/obsidian-dashboard/my-app/app/components/desktop/OverviewPanel.tsx 的设计风格，在 05 工具箱/vault-pilot/app/components/ 下创建 OverviewPanel.tsx，用于分析所有文件夹的数据概况：各文件夹文件数和大小统计、最近修改的文件、本周活跃度。使用 Meridian 的 glass-card 样式。在 page.tsx 中注册为左侧导航项「总览」。',
        icon: '📊',
    },
    {
        label: '创建内容创作导航',
        description: '文章列表、专栏进度、最近编辑',
        cmd: '使用 meridian Skill。一次只创建一个面板。参考 05 工具箱/obsidian-dashboard/my-app/app/components/desktop/ContentPanel.tsx 的设计风格，在 05 工具箱/vault-pilot/app/components/ 下创建 ContentPanel.tsx，读取 01 内容创作/ 下的独立文章和专栏文章列表（从文件名提取标题和日期），展示文章数量统计和最近文章。使用 Meridian 的 glass-card 样式。在 page.tsx 中注册为左侧导航项「创作」。',
        icon: '📝',
    },
    {
        label: '创建计划导航',
        description: '周计划、每日记录和完成情况',
        cmd: '使用 meridian Skill。一次只创建一个面板。参考 05 工具箱/obsidian-dashboard/my-app/app/components/desktop/GoalsPanel.tsx 的设计风格，在 05 工具箱/vault-pilot/app/components/ 下创建 PlanningPanel.tsx，读取 06 计划/ 下的周计划和每日记录（daily_log.jsonl），展示本周计划内容和每日完成情况。使用 Meridian 的 glass-card 样式。在 page.tsx 中注册为左侧导航项「计划」。',
        icon: '📅',
    },
    {
        label: '创建复盘导航',
        description: '产出统计、进度条、复盘报告',
        cmd: '使用 meridian Skill。一次只创建一个面板。参考 05 工具箱/obsidian-dashboard/my-app/app/components/desktop/ReviewPanel.tsx 的设计风格，在 05 工具箱/vault-pilot/app/components/ 下创建 ReviewPanel.tsx，读取 06 计划/05 周复盘/ 和 goals_tracker.jsonl，展示本周产出统计（文章/视频/动态的进度条）和最近的复盘报告。使用 Meridian 的 glass-card 样式。在 page.tsx 中注册为左侧导航项「复盘」。',
        icon: '🔄',
    },
];

export function NewNavModal({ onClose }: NewNavModalProps) {
    const [customCmd, setCustomCmd] = useState('');
    const [sending, setSending] = useState<string | null>(null);

    const handleSend = (cmd: string, label: string) => {
        setSending(label);
        launchClaude(cmd);
        setTimeout(() => {
            setSending(null);
            onClose();
        }, 800);
    };

    const handleCustomSend = () => {
        if (!customCmd.trim()) return;
        const fullCmd = `使用 meridian Skill。一次只创建一个面板。${customCmd.trim()}。使用 Meridian 的 glass-card 样式。在 page.tsx 中注册为新的左侧导航项。`;
        handleSend(fullCmd, 'custom');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-lg rounded-2xl bg-popover border border-border overflow-hidden animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                    <div className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-violet-400" />
                        <span className="font-semibold text-sm">新增导航面板</span>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Presets */}
                <div className="p-5 space-y-4">
                    <div className="text-[11px] text-muted-foreground mb-2">快捷指令 — 点击发送到 Claude Code 创建</div>
                    <div className="grid grid-cols-2 gap-2">
                        {presetActions.map(a => (
                            <button
                                key={a.label}
                                onClick={() => handleSend(a.cmd, a.label)}
                                disabled={sending !== null}
                                className="flex items-start gap-3 p-3 rounded-xl border border-border/50 hover:border-violet-500/30 hover:bg-secondary/20 transition-all text-left group"
                            >
                                <span className="text-xl mt-0.5">{a.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium group-hover:text-foreground transition-colors">
                                        {sending === a.label ? (
                                            <span className="flex items-center gap-1 text-violet-400">
                                                <Loader2 className="h-3 w-3 animate-spin" /> 发送中...
                                            </span>
                                        ) : a.label}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{a.description}</div>
                                </div>
                                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 mt-1 shrink-0" />
                            </button>
                        ))}
                    </div>

                    {/* Custom */}
                    <div className="pt-3 border-t border-border/30">
                        <div className="text-[11px] text-muted-foreground mb-2">自定义指令</div>
                        <div className="flex gap-2">
                            <input
                                value={customCmd}
                                onChange={e => setCustomCmd(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCustomSend()}
                                placeholder="描述你想创建的导航面板..."
                                className="flex-1 px-3 py-2 rounded-xl bg-secondary/30 border border-border/50 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-violet-500/50"
                            />
                            <button
                                onClick={handleCustomSend}
                                disabled={!customCmd.trim() || sending !== null}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-medium disabled:opacity-40 flex items-center gap-1.5 hover:from-violet-500 hover:to-indigo-500 transition-all"
                            >
                                <Send className="h-3 w-3" />
                                发送
                            </button>
                        </div>
                        <div className="text-[9px] text-muted-foreground/50 mt-1.5">
                            会自动附加 Meridian Skill 和样式规则
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
