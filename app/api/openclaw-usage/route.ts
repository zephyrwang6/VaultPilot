import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const OPENCLAW_DIR = path.join(process.env.HOME || '/Users/ugreen', '.openclaw');
const CONFIG_PATH = path.join(process.cwd(), 'vault-pilot.config.json');

async function getOpenClawAgent(): Promise<string> {
    try {
        const config = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf-8'));
        return config.openclawAgent || 'main';
    } catch {
        return 'main';
    }
}

interface SessionMessage {
    type: string;
    id: string;
    timestamp: string;
    message: {
        role: string;
        content: any;
        provider?: string;
        model?: string;
        usage?: {
            input: number;
            output: number;
            cacheRead?: number;
            cacheWrite?: number;
            totalTokens?: number;
            cost?: { total?: number };
        };
        stopReason?: string;
        timestamp?: number;
    };
}

export async function GET() {
    try {
        const agentId = await getOpenClawAgent();
        const sessionsDir = path.join(OPENCLAW_DIR, 'agents', agentId, 'sessions');

        // Read all session JSONL files
        let entries: string[];
        try {
            entries = await fs.readdir(sessionsDir);
        } catch {
            return NextResponse.json({ error: 'No sessions found' }, { status: 404 });
        }

        const jsonlFiles = entries.filter(f => f.endsWith('.jsonl') && !f.includes('.deleted.'));

        const allMessages: SessionMessage[] = [];
        for (const file of jsonlFiles) {
            try {
                const content = await fs.readFile(path.join(sessionsDir, file), 'utf-8');
                const lines = content.trim().split('\n').filter(Boolean);
                for (const line of lines) {
                    try {
                        const parsed = JSON.parse(line);
                        if (parsed.type === 'message' && parsed.message?.role === 'assistant' && parsed.message?.usage) {
                            allMessages.push(parsed);
                        }
                    } catch { /* skip malformed lines */ }
                }
            } catch { /* skip unreadable files */ }
        }

        // Sort by timestamp
        allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Aggregate stats
        let totalInput = 0;
        let totalOutput = 0;
        let totalCacheRead = 0;
        let totalCalls = 0;
        const modelUsage: Record<string, { input: number; output: number; calls: number }> = {};
        const dailyActivity: Record<string, { input: number; output: number; calls: number }> = {};
        const hourCounts: Record<number, number> = {};

        for (const msg of allMessages) {
            const u = msg.message.usage!;
            const model = msg.message.model || 'unknown';
            const provider = msg.message.provider || '';
            const modelKey = provider ? `${provider}/${model}` : model;
            const date = msg.timestamp.slice(0, 10); // YYYY-MM-DD
            const hour = new Date(msg.timestamp).getHours();

            totalInput += u.input || 0;
            totalOutput += u.output || 0;
            totalCacheRead += u.cacheRead || 0;
            totalCalls++;

            // Per model
            if (!modelUsage[modelKey]) modelUsage[modelKey] = { input: 0, output: 0, calls: 0 };
            modelUsage[modelKey].input += u.input || 0;
            modelUsage[modelKey].output += u.output || 0;
            modelUsage[modelKey].calls++;

            // Per day
            if (!dailyActivity[date]) dailyActivity[date] = { input: 0, output: 0, calls: 0 };
            dailyActivity[date].input += u.input || 0;
            dailyActivity[date].output += u.output || 0;
            dailyActivity[date].calls++;

            // Per hour
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }

        // Convert daily to sorted array
        const dailyArray = Object.entries(dailyActivity)
            .map(([date, stats]) => ({ date, ...stats }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Agent info
        let agentInfo = null;
        try {
            const { execFile } = await import('child_process');
            const { promisify } = await import('util');
            const execFileAsync = promisify(execFile);
            const { stdout } = await execFileAsync('openclaw', ['agents', 'list', '--json'], { timeout: 10_000 });
            const agents = JSON.parse(stdout);
            agentInfo = agents.find((a: any) => a.id === agentId) || agents[0] || null;
        } catch { /* skip */ }

        return NextResponse.json({
            totalInput,
            totalOutput,
            totalCacheRead,
            totalCalls,
            totalSessions: jsonlFiles.length,
            modelUsage,
            dailyActivity: dailyArray,
            hourCounts,
            agentInfo,
            firstDate: allMessages[0]?.timestamp?.slice(0, 10) || null,
            lastDate: allMessages[allMessages.length - 1]?.timestamp?.slice(0, 10) || null,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to read usage data' }, { status: 500 });
    }
}
