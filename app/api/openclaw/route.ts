import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execFileAsync = promisify(execFile);
const CONFIG_PATH = path.join(process.cwd(), 'vault-pilot.config.json');

async function getConfig(): Promise<{ vaultPath: string; openclawAgent: string }> {
    try {
        const config = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf-8'));
        return {
            vaultPath: config.vaultPath || process.env.HOME || '/tmp',
            openclawAgent: config.openclawAgent || 'main',
        };
    } catch {
        return { vaultPath: process.env.HOME || '/tmp', openclawAgent: 'main' };
    }
}

export async function POST(request: NextRequest) {
    try {
        const { message } = await request.json();
        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'message is required' }, { status: 400 });
        }

        const { vaultPath, openclawAgent } = await getConfig();
        const { stdout, stderr } = await execFileAsync(
            'openclaw',
            ['agent', '--agent', openclawAgent, '--message', message, '--json'],
            { cwd: vaultPath, timeout: 120_000, maxBuffer: 10 * 1024 * 1024 }
        );

        let result;
        try {
            result = JSON.parse(stdout);
        } catch {
            result = { text: stdout.trim() };
        }

        return NextResponse.json({ success: true, result, stderr: stderr || undefined });
    } catch (error: any) {
        return NextResponse.json({
            error: error.message || 'OpenClaw execution failed',
            stderr: error.stderr || '',
        }, { status: 500 });
    }
}
