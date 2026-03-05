import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'vault-pilot.config.json');

async function getVaultPath(): Promise<string> {
    try {
        const config = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf-8'));
        return config.vaultPath || process.env.HOME || '/tmp';
    } catch {
        return process.env.HOME || '/tmp';
    }
}

export async function POST(request: NextRequest) {
    try {
        const { command } = await request.json();
        if (!command || typeof command !== 'string') {
            return NextResponse.json({ error: 'command is required' }, { status: 400 });
        }

        const vaultPath = await getVaultPath();
        const shellCmd = `cd "${vaultPath}" && claude "${command.replace(/"/g, '\\"')}"`;
        const appleScript = [
            'tell application "Terminal"',
            '  activate',
            `  do script "${shellCmd.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`,
            'end tell',
        ].join('\n');

        execFile('osascript', ['-e', appleScript], (err) => {
            if (err) console.error('osascript error:', err.message);
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to launch terminal' }, { status: 500 });
    }
}
