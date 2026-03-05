'use client';

import { Folder, FileText, BarChart3, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { PanelConfig } from '@/lib/types';

interface DynamicPanelProps {
    panel: PanelConfig;
    vaultPath: string;
}

interface FileEntry {
    name: string;
    isDir: boolean;
    size?: number;
}

export function DynamicPanel({ panel, vaultPath }: DynamicPanelProps) {
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (panel.path) {
            const fullPath = panel.path.startsWith('/') ? panel.path : `${vaultPath}/${panel.path}`;
            fetch(`/api/vault?path=${encodeURIComponent(fullPath)}`)
                .then(r => r.json())
                .then(data => {
                    if (data.structure) {
                        setFiles(data.structure.map((f: any) => ({
                            name: f.name,
                            isDir: true,
                            size: f.fileCount,
                        })));
                    }
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [panel.path, vaultPath]);

    return (
        <div className="space-y-5 stagger-children">
            <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Folder className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-medium">{panel.label}</span>
                    {panel.description && (
                        <span className="text-[10px] text-muted-foreground ml-auto">{panel.description}</span>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                ) : files.length > 0 ? (
                    <div className="space-y-1">
                        {files.map((f) => (
                            <div key={f.name} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-secondary/30 transition-colors">
                                {f.isDir ? <Folder className="h-3.5 w-3.5 text-violet-400" /> : <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                                <span className="text-xs flex-1">{f.name}</span>
                                {f.size !== undefined && <span className="text-[10px] text-muted-foreground">{f.size} 项</span>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                        此面板由 Agent 动态生成，可通过对话自定义内容
                    </div>
                )}
            </div>
        </div>
    );
}
