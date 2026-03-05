import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'vault-pilot.config.json');

interface FolderInfo {
    name: string;
    path: string;
    children: FolderInfo[];
    fileCount: number;
}

async function scanDir(dirPath: string, depth = 0, maxDepth = 2): Promise<FolderInfo[]> {
    if (depth > maxDepth) return [];
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const folders: FolderInfo[] = [];
        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
            const fullPath = path.join(dirPath, entry.name);
            const children = depth < maxDepth ? await scanDir(fullPath, depth + 1, maxDepth) : [];
            // Count files in this dir
            let fileCount = 0;
            try {
                const files = await fs.readdir(fullPath);
                fileCount = files.filter(f => !f.startsWith('.')).length;
            } catch { /* skip */ }
            folders.push({ name: entry.name, path: fullPath, children, fileCount });
        }
        return folders;
    } catch {
        return [];
    }
}

export async function GET() {
    try {
        let config: any = null;
        try {
            config = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf-8'));
        } catch { /* not bound */ }

        if (!config?.vaultPath) {
            return NextResponse.json({ error: 'Vault not bound' }, { status: 400 });
        }

        const structure = await scanDir(config.vaultPath);
        return NextResponse.json({ vaultPath: config.vaultPath, structure });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to scan vault' }, { status: 500 });
    }
}
