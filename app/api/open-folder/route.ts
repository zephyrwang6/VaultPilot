import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';

export async function POST(request: NextRequest) {
    const { path, action } = await request.json();
    if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 });

    try {
        if (action === 'finder') {
            execFile('open', [path]);
        } else if (action === 'terminal') {
            const script = `tell application "Terminal"
        activate
        do script "cd ${path.replace(/"/g, '\\"')}"
      end tell`;
            execFile('osascript', ['-e', script]);
        }
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
