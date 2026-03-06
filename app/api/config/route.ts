import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'vault-pilot.config.json');

// GET: read config + agent markdown
export async function GET() {
    try {
        let config = null;
        try {
            const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
            config = JSON.parse(raw);
        } catch {
            // No config yet
        }

        let agentMd = '';
        if (config?.vaultPath) {
            const agentType = config.agentType || 'claude-code';
            const mdFiles = agentType === 'openclaw'
                ? ['AGENTS.md', 'openclaw.md', 'CLAUDE.md', '.claude.md', 'claude.md']
                : ['CLAUDE.md', '.claude.md', 'claude.md'];

            for (const name of mdFiles) {
                try {
                    agentMd = await fs.readFile(path.join(config.vaultPath, name), 'utf-8');
                    break;
                } catch { /* try next */ }
            }
        }

        return NextResponse.json({ config, agentMd, claudeMd: agentMd });
    } catch (error) {
        return NextResponse.json({ config: null, agentMd: '', claudeMd: '' });
    }
}

// POST: save config
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, vaultPath, agentType, panels } = body;

        if (action === 'bind-vault') {
            if (!vaultPath) return NextResponse.json({ error: 'vaultPath required' }, { status: 400 });

            if (body.createIfMissing) {
                try {
                    await fs.mkdir(vaultPath, { recursive: true });
                } catch {
                    return NextResponse.json({ error: 'Failed to create directory' }, { status: 500 });
                }
            }

            try {
                await fs.access(vaultPath);
            } catch {
                return NextResponse.json({ error: 'Path does not exist' }, { status: 400 });
            }

            const config = {
                vaultPath,
                boundAt: new Date().toISOString(),
                agentType: agentType || 'claude-code',
                panels: [],
            };
            await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
            return NextResponse.json({ success: true, config });
        }

        if (action === 'save-panels') {
            let config: any = {};
            try {
                config = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf-8'));
            } catch { /* new config */ }
            config.panels = panels || [];
            await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
    }
}
