import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'vault-pilot.config.json');

// GET: read config + .claude.md
export async function GET() {
    try {
        let config = null;
        try {
            const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
            config = JSON.parse(raw);
        } catch {
            // No config yet
        }

        // Read .claude.md or CLAUDE.md from vault if bound
        let claudeMd = '';
        if (config?.vaultPath) {
            for (const name of ['CLAUDE.md', '.claude.md', 'claude.md']) {
                try {
                    claudeMd = await fs.readFile(path.join(config.vaultPath, name), 'utf-8');
                    break;
                } catch { /* try next */ }
            }
        }

        return NextResponse.json({ config, claudeMd });
    } catch (error) {
        return NextResponse.json({ config: null, claudeMd: '' });
    }
}

// POST: save config
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, vaultPath, panels } = body;

        if (action === 'bind-vault') {
            if (!vaultPath) return NextResponse.json({ error: 'vaultPath required' }, { status: 400 });
            // Verify path exists
            try {
                await fs.access(vaultPath);
            } catch {
                return NextResponse.json({ error: 'Path does not exist' }, { status: 400 });
            }

            const config = {
                vaultPath,
                boundAt: new Date().toISOString(),
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
