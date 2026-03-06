import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function GET() {
    try {
        const statsPath = path.join(os.homedir(), '.claude', 'stats-cache.json');
        const raw = await fs.readFile(statsPath, 'utf-8');
        const stats = JSON.parse(raw);

        return NextResponse.json({
            dailyActivity: stats.dailyActivity || [],
            dailyModelTokens: stats.dailyModelTokens || [],
            modelUsage: stats.modelUsage || {},
            totalSessions: stats.totalSessions || 0,
            totalMessages: stats.totalMessages || 0,
            firstSessionDate: stats.firstSessionDate || null,
            lastComputedDate: stats.lastComputedDate || null,
            hourCounts: stats.hourCounts || {},
            longestSession: stats.longestSession || null,
        });
    } catch {
        return NextResponse.json({ error: 'Cannot read stats-cache.json' }, { status: 500 });
    }
}
