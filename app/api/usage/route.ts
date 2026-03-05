import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CLAUDE_DIR = path.join(process.env.HOME || '/Users/ugreen', '.claude', 'projects');

interface SessionUsage {
    sessionId: string;
    firstPrompt: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    messageCount: number;
    created: string;
    modified: string;
}

export async function GET() {
    try {
        // Find all project dirs
        const projects = await fs.readdir(CLAUDE_DIR, { withFileTypes: true });
        const allSessions: SessionUsage[] = [];
        const modelCounts: Record<string, number> = {};
        let totalInput = 0, totalOutput = 0, totalCacheCreate = 0, totalCacheRead = 0;
        let totalSessions = 0;

        for (const proj of projects) {
            if (!proj.isDirectory()) continue;

            // Read sessions-index.json
            const indexPath = path.join(CLAUDE_DIR, proj.name, 'sessions-index.json');
            try {
                const indexRaw = await fs.readFile(indexPath, 'utf-8');
                const index = JSON.parse(indexRaw);
                if (!index.entries) continue;

                for (const entry of index.entries) {
                    totalSessions++;

                    // Parse the JSONL file for usage data
                    try {
                        const raw = await fs.readFile(entry.fullPath, 'utf-8');
                        const lines = raw.split('\n').filter(l => l.trim());
                        let sessionInput = 0, sessionOutput = 0, sessionCacheCreate = 0, sessionCacheRead = 0;
                        let model = '';

                        for (const line of lines) {
                            try {
                                const obj = JSON.parse(line);
                                if (obj.message?.model) model = obj.message.model;
                                if (obj.message?.usage) {
                                    const u = obj.message.usage;
                                    sessionInput += u.input_tokens || 0;
                                    sessionOutput += u.output_tokens || 0;
                                    sessionCacheCreate += u.cache_creation_input_tokens || 0;
                                    sessionCacheRead += u.cache_read_input_tokens || 0;
                                }
                            } catch { /* skip bad line */ }
                        }

                        if (model) {
                            modelCounts[model] = (modelCounts[model] || 0) + 1;
                        }

                        totalInput += sessionInput;
                        totalOutput += sessionOutput;
                        totalCacheCreate += sessionCacheCreate;
                        totalCacheRead += sessionCacheRead;

                        if (sessionInput > 0 || sessionOutput > 0) {
                            allSessions.push({
                                sessionId: entry.sessionId,
                                firstPrompt: (entry.firstPrompt || '').slice(0, 80),
                                model,
                                inputTokens: sessionInput,
                                outputTokens: sessionOutput,
                                cacheCreationTokens: sessionCacheCreate,
                                cacheReadTokens: sessionCacheRead,
                                messageCount: entry.messageCount || 0,
                                created: entry.created || '',
                                modified: entry.modified || '',
                            });
                        }
                    } catch { /* skip unreadable session */ }
                }
            } catch { /* skip project without index */ }
        }

        // Sort by most recent
        allSessions.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

        return NextResponse.json({
            totalSessions,
            totalInput,
            totalOutput,
            totalCacheCreate,
            totalCacheRead,
            totalTokens: totalInput + totalOutput + totalCacheCreate + totalCacheRead,
            models: modelCounts,
            recentSessions: allSessions.slice(0, 20),
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read usage data' }, { status: 500 });
    }
}
