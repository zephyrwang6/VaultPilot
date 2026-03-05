'use client';

import { useState, useEffect } from 'react';
import { Terminal, ExternalLink, Sparkles, ChevronDown, ChevronRight, Folder, FileText, BookOpen, Loader2 } from 'lucide-react';
import type { SkillInfo, VaultFolder } from '@/lib/types';
import ReactMarkdown from 'react-markdown';

interface AgentPanelProps {
    vaultPath: string;
    claudeMd: string;
}

const categoryColors: Record<string, string> = {
    '内容创作': 'badge-glow-blue', '写作': 'badge-glow-green', '内容处理': 'badge-glow-purple',
    '内容采集': 'badge-glow-amber', '任务管理': 'badge-glow-purple', '记忆系统': 'badge-glow-blue',
    '选题管理': 'badge-glow-amber', '视觉设计': 'badge-glow-green', '文档工具': 'badge-glow-blue',
    '开发工具': 'badge-glow-green', '其他': 'badge-glow-purple',
};

function groupByCategory(skills: SkillInfo[]) {
    const g: Record<string, SkillInfo[]> = {};
    for (const s of skills) { const c = s.category || '其他'; if (!g[c]) g[c] = []; g[c].push(s); }
    return g;
}

// ─── Sub-Components ───

function CommandInput({ vaultPath }: { vaultPath: string }) {
    const [command, setCommand] = useState('');

    const handleExecute = async () => {
        if (!command.trim()) return;
        await fetch('/api/claude', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: command.trim() }),
        });
        setCommand('');
    };

    // Guided prompt suggestions
    const prompts = [
        '帮我分析这个 Obsidian 文件夹结构，生成看板面板配置',
        '列出最近修改的 5 个文件',
        '帮我制定本周工作计划',
    ];

    return (
        <div className="glass-card rounded-2xl p-5 border-violet-500/20">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-muted-foreground">Claude Code CLI</span>
                <span className="text-[10px] text-muted-foreground ml-auto truncate max-w-[200px]" title={vaultPath}>{vaultPath}</span>
            </div>
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400" />
                    <input
                        type="text"
                        placeholder="输入指令，回车在终端中启动 Claude..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:border-violet-500/40 transition-colors"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
                    />
                </div>
                <button
                    onClick={handleExecute}
                    disabled={!command.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    <ExternalLink className="h-4 w-4" />
                    打开终端
                </button>
            </div>
            {/* Guided prompts */}
            <div className="mt-3 flex flex-wrap gap-1.5">
                {prompts.map((p) => (
                    <button
                        key={p}
                        onClick={() => setCommand(p)}
                        className="text-[10px] px-2 py-1 rounded-lg bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                    >
                        {p.length > 20 ? p.slice(0, 20) + '...' : p}
                    </button>
                ))}
            </div>
        </div>
    );
}

function ClaudeMdCard({ content }: { content: string }) {
    const [expanded, setExpanded] = useState(false);

    if (!content) return null;

    return (
        <div className="glass-card rounded-2xl p-5">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-2 text-left"
            >
                <BookOpen className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-medium flex-1">Agent 运行原则</span>
                <span className="text-[10px] text-muted-foreground">.claude.md</span>
                {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </button>
            {expanded && (
                <div className="mt-3 prose prose-sm prose-invert max-w-none text-xs text-muted-foreground leading-relaxed max-h-[300px] overflow-y-auto rounded-xl bg-secondary/20 p-4">
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
            )}
        </div>
    );
}

function SkillsLibrary() {
    const [skills, setSkills] = useState<SkillInfo[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);

    const loadSkills = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/skills');
            const data = await res.json();
            setSkills(data);
            setLoaded(true);
        } catch { /* skip */ }
        setLoading(false);
    };

    const groups = groupByCategory(skills);

    return (
        <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium">Skills 库</span>
                {loaded && <span className="text-xs text-muted-foreground ml-auto">{skills.length} 个</span>}
            </div>

            {!loaded ? (
                <button
                    onClick={loadSkills}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 text-sm text-muted-foreground hover:text-foreground transition-all"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {loading ? '加载中...' : '点击加载 ~/.claude/skills'}
                </button>
            ) : (
                <div className="space-y-3">
                    {Object.entries(groups).map(([cat, catSkills]) => (
                        <div key={cat}>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${categoryColors[cat] || 'badge-glow-purple'}`}>{cat}</span>
                                <span className="text-[10px] text-muted-foreground">{catSkills.length}</span>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
                                {catSkills.map((skill) => (
                                    <div
                                        key={skill.name}
                                        className="p-2 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all cursor-default"
                                        title={skill.description}
                                    >
                                        <div className="font-medium text-xs truncate">{skill.name}</div>
                                        <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{skill.description}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function VaultStructure({ vaultPath }: { vaultPath: string }) {
    const [structure, setStructure] = useState<VaultFolder[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetch('/api/vault')
            .then(r => r.json())
            .then(data => { if (data.structure) { setStructure(data.structure); setLoaded(true); } })
            .catch(() => { });
    }, [vaultPath]);

    const toggle = (path: string) => {
        const next = new Set(expanded);
        next.has(path) ? next.delete(path) : next.add(path);
        setExpanded(next);
    };

    const renderFolder = (folder: VaultFolder, depth = 0) => (
        <div key={folder.path} style={{ paddingLeft: depth * 16 }}>
            <button
                onClick={() => toggle(folder.path)}
                className="flex items-center gap-2 py-1 w-full text-left hover:text-foreground transition-colors text-muted-foreground"
            >
                {folder.children.length > 0 ? (
                    expanded.has(folder.path) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
                ) : <span className="w-3" />}
                <Folder className="h-3.5 w-3.5 text-violet-400" />
                <span className="text-xs">{folder.name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{folder.fileCount}</span>
            </button>
            {expanded.has(folder.path) && folder.children.map(c => renderFolder(c, depth + 1))}
        </div>
    );

    if (!loaded) return null;

    return (
        <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
                <Folder className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-medium">Vault 结构</span>
                <span className="text-xs text-muted-foreground ml-auto">{structure.length} 个顶层目录</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-0.5">
                {structure.map(f => renderFolder(f))}
            </div>
            <div className="mt-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
                <p className="text-[11px] text-violet-300">
                    💡 <strong>提示</strong>：在上方指令框输入「帮我分析文件夹结构，生成看板面板」，Claude 会根据你的目录结构生成个性化的导航面板
                </p>
            </div>
        </div>
    );
}

// ─── Main Agent Panel ───

export function AgentPanel({ vaultPath, claudeMd }: AgentPanelProps) {
    return (
        <div className="space-y-5 stagger-children">
            <CommandInput vaultPath={vaultPath} />
            <ClaudeMdCard content={claudeMd} />
            <VaultStructure vaultPath={vaultPath} />
            <SkillsLibrary />
        </div>
    );
}
