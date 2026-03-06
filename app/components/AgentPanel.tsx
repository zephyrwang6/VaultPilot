'use client';

import { useState, useRef, useEffect } from 'react';
import { Terminal, ExternalLink, Sparkles, ChevronDown, ChevronRight, BookOpen, Loader2, RefreshCw, Send, MessageSquare } from 'lucide-react';
import type { AgentType, ChatMessage, SkillInfo } from '@/lib/types';
import ReactMarkdown from 'react-markdown';

interface AgentPanelProps {
    vaultPath: string;
    agentMd: string;
    agentType: AgentType;
    onRebind: () => void;
}

const categoryColors: Record<string, string> = {
    '内容创作': 'badge-glow-blue', '写作': 'badge-glow-green', '内容处理': 'badge-glow-purple',
    '内容采集': 'badge-glow-amber', '任务管理': 'badge-glow-purple', '记忆系统': 'badge-glow-blue',
    '选题管理': 'badge-glow-amber', '视觉设计': 'badge-glow-green', '文档工具': 'badge-glow-blue',
    '开发工具': 'badge-glow-green', 'Agent': 'badge-glow-amber', '其他': 'badge-glow-purple',
};

function groupByCategory(skills: SkillInfo[]) {
    const g: Record<string, SkillInfo[]> = {};
    for (const s of skills) { const c = s.category || '其他'; if (!g[c]) g[c] = []; g[c].push(s); }
    return g;
}

// ─── Claude Code: Terminal Command Input ───

function CommandInput({ vaultPath, onRebind }: { vaultPath: string; onRebind: () => void }) {
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
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                {prompts.map((p) => (
                    <button
                        key={p}
                        onClick={() => setCommand(p)}
                        className="text-[10px] px-2 py-1 rounded-lg bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                    >
                        {p.length > 20 ? p.slice(0, 20) + '...' : p}
                    </button>
                ))}
                <button
                    onClick={onRebind}
                    className="text-[10px] px-2 py-1 rounded-lg bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors flex items-center gap-1 ml-auto"
                >
                    <RefreshCw className="h-3 w-3" />
                    重新绑定
                </button>
            </div>
        </div>
    );
}

// ─── OpenClaw: Embedded Chat ───

function OpenClawChat({ vaultPath, onRebind }: { vaultPath: string; onRebind: () => void }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const userMsg: ChatMessage = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/openclaw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg.content }),
            });
            const data = await res.json();
            let text: string;
            if (data.success) {
                // OpenClaw returns { result: { payloads: [{ text: "..." }] } }
                const payloads = data.result?.result?.payloads || data.result?.payloads;
                if (payloads?.[0]?.text) {
                    text = payloads[0].text;
                } else {
                    text = data.result?.text || data.result?.output || data.result?.message || JSON.stringify(data.result);
                }
            } else {
                text = data.error || '请求失败';
            }
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: text,
                timestamp: new Date().toISOString(),
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '网络错误，请重试',
                timestamp: new Date().toISOString(),
            }]);
        }
        setLoading(false);
    };

    const prompts = [
        '帮我分析这个文件夹结构',
        '列出最近修改的文件',
        '帮我制定本周计划',
    ];

    return (
        <div className="glass-card rounded-2xl p-5 border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-muted-foreground">OpenClaw Agent</span>
                <span className="text-[10px] text-muted-foreground ml-auto truncate max-w-[200px]" title={vaultPath}>{vaultPath}</span>
            </div>

            {/* Messages */}
            {messages.length > 0 && (
                <div className="max-h-[400px] overflow-y-auto mb-3 space-y-3 rounded-xl bg-secondary/10 p-3">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${msg.role === 'user'
                                ? 'bg-gradient-to-r from-emerald-600/80 to-teal-600/80 text-white'
                                : 'bg-secondary/40 text-foreground'
                                }`}>
                                {msg.role === 'assistant' ? (
                                    <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                ) : msg.content}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-secondary/40 rounded-xl px-3 py-2 flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                                <span className="text-xs text-muted-foreground">思考中...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* Input */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                    <input
                        type="text"
                        placeholder="输入消息，直接与 OpenClaw 对话..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:border-emerald-500/40 transition-colors"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={loading}
                    />
                </div>
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    发送
                </button>
            </div>

            {/* Quick prompts + rebind */}
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                {prompts.map((p) => (
                    <button
                        key={p}
                        onClick={() => setInput(p)}
                        className="text-[10px] px-2 py-1 rounded-lg bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                    >
                        {p}
                    </button>
                ))}
                <button
                    onClick={onRebind}
                    className="text-[10px] px-2 py-1 rounded-lg bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors flex items-center gap-1 ml-auto"
                >
                    <RefreshCw className="h-3 w-3" />
                    重新绑定
                </button>
            </div>
        </div>
    );
}

// ─── Shared: Agent Markdown Card ───

function AgentMdCard({ content, agentType }: { content: string; agentType: AgentType }) {
    const [expanded, setExpanded] = useState(false);

    if (!content) return null;

    const label = agentType === 'openclaw' ? 'AGENTS.md' : '.claude.md';
    const title = agentType === 'openclaw' ? 'Agent 配置文件' : 'Agent 运行原则';

    return (
        <div className="glass-card rounded-2xl p-5">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-2 text-left"
            >
                <BookOpen className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-medium flex-1">{title}</span>
                <span className="text-[10px] text-muted-foreground">{label}</span>
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

// ─── Shared: Skills / Agents Library ───

function SkillsLibrary({ agentType }: { agentType: AgentType }) {
    const [skills, setSkills] = useState<SkillInfo[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);

    const isOpenClaw = agentType === 'openclaw';

    const loadSkills = async () => {
        setLoading(true);
        try {
            const url = isOpenClaw ? '/api/skills?agent=openclaw' : '/api/skills';
            const res = await fetch(url);
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
                <span className="text-sm font-medium">{isOpenClaw ? 'Agents' : 'Skills 库'}</span>
                {loaded && <span className="text-xs text-muted-foreground ml-auto">{skills.length} 个</span>}
            </div>

            {!loaded ? (
                <button
                    onClick={loadSkills}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 text-sm text-muted-foreground hover:text-foreground transition-all"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {loading ? '加载中...' : isOpenClaw ? '点击加载 OpenClaw Agents' : '点击加载 ~/.claude/skills'}
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

// ─── Main Agent Panel ───

export function AgentPanel({ vaultPath, agentMd, agentType, onRebind }: AgentPanelProps) {
    return (
        <div className="space-y-5 stagger-children">
            {agentType === 'openclaw'
                ? <OpenClawChat vaultPath={vaultPath} onRebind={onRebind} />
                : <CommandInput vaultPath={vaultPath} onRebind={onRebind} />
            }
            <AgentMdCard content={agentMd} agentType={agentType} />
            <SkillsLibrary agentType={agentType} />
        </div>
    );
}
