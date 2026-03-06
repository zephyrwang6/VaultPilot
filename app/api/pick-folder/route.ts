import { NextResponse } from 'next/server';
import { execFile } from 'child_process';

// Opens macOS native folder picker dialog and returns the selected path
export async function POST() {
    try {
        const result = await new Promise<string>((resolve, reject) => {
            const script = `
        set chosenFolder to choose folder with prompt "选择你的 Obsidian 文件夹"
        return POSIX path of chosenFolder
      `;
            execFile('osascript', ['-e', script], { timeout: 60000 }, (error, stdout, stderr) => {
                if (error) {
                    if (error.code === 1 || error.killed) {
                        reject(new Error('cancelled'));
                    } else {
                        reject(error);
                    }
                } else {
                    // Remove trailing slash
                    resolve(stdout.trim().replace(/\/$/, ''));
                }
            });
        });

        return NextResponse.json({ success: true, path: result });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        if (msg === 'cancelled') {
            return NextResponse.json({ success: false, cancelled: true });
        }
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
