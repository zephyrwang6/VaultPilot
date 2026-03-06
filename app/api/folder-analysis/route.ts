import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface FileInfo {
    name: string;
    ext: string;
    size: number;
    modifiedAt: string;
    isDir: boolean;
}

interface FolderStats {
    folderName: string;
    folderPath: string;
    totalFiles: number;
    totalFolders: number;
    totalSize: number;
    filesByType: Record<string, number>;
    recentFiles: FileInfo[];
    largestFiles: FileInfo[];
    folderSizes: { name: string; fileCount: number; size: number }[];
    modifiedToday: number;
    modifiedThisWeek: number;
    modifiedThisMonth: number;
}

async function scanRecursive(dirPath: string, depth = 0): Promise<FileInfo[]> {
    const results: FileInfo[] = [];
    if (depth > 4) return results;
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
            const fullPath = path.join(dirPath, entry.name);
            try {
                const stat = await fs.stat(fullPath);
                results.push({
                    name: entry.name,
                    ext: entry.isDirectory() ? 'folder' : path.extname(entry.name).slice(1).toLowerCase() || 'other',
                    size: stat.size,
                    modifiedAt: stat.mtime.toISOString(),
                    isDir: entry.isDirectory(),
                });
                if (entry.isDirectory()) {
                    const children = await scanRecursive(fullPath, depth + 1);
                    results.push(...children);
                }
            } catch { /* skip */ }
        }
    } catch { /* skip */ }
    return results;
}

export async function GET(request: NextRequest) {
    const folderPath = request.nextUrl.searchParams.get('path');
    if (!folderPath) {
        return NextResponse.json({ error: 'path required' }, { status: 400 });
    }

    try {
        const allFiles = await scanRecursive(folderPath);
        const files = allFiles.filter(f => !f.isDir);
        const folders = allFiles.filter(f => f.isDir);

        // File type distribution
        const filesByType: Record<string, number> = {};
        for (const f of files) {
            filesByType[f.ext] = (filesByType[f.ext] || 0) + 1;
        }

        // Time-based counts
        const now = Date.now();
        const dayMs = 86400000;
        const modifiedToday = files.filter(f => now - new Date(f.modifiedAt).getTime() < dayMs).length;
        const modifiedThisWeek = files.filter(f => now - new Date(f.modifiedAt).getTime() < 7 * dayMs).length;
        const modifiedThisMonth = files.filter(f => now - new Date(f.modifiedAt).getTime() < 30 * dayMs).length;

        // Recent files (last modified)
        const recentFiles = [...files]
            .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())
            .slice(0, 10);

        // Largest files
        const largestFiles = [...files]
            .sort((a, b) => b.size - a.size)
            .slice(0, 10);

        // Top-level subfolder sizes
        const topEntries = await fs.readdir(folderPath, { withFileTypes: true });
        const folderSizes: { name: string; fileCount: number; size: number }[] = [];
        for (const entry of topEntries) {
            if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
            const subFiles = allFiles.filter(f =>
                !f.isDir && allFiles.some(p => p.name === entry.name && p.isDir)
            );
            // Re-scan just this subfolder for accurate counts
            const subPath = path.join(folderPath, entry.name);
            const subScan = await scanRecursive(subPath);
            const subFileOnly = subScan.filter(f => !f.isDir);
            folderSizes.push({
                name: entry.name,
                fileCount: subFileOnly.length,
                size: subFileOnly.reduce((s, f) => s + f.size, 0),
            });
        }
        folderSizes.sort((a, b) => b.fileCount - a.fileCount);

        const stats: FolderStats = {
            folderName: path.basename(folderPath),
            folderPath,
            totalFiles: files.length,
            totalFolders: folders.length,
            totalSize: files.reduce((s, f) => s + f.size, 0),
            filesByType,
            recentFiles,
            largestFiles,
            folderSizes: folderSizes.slice(0, 15),
            modifiedToday,
            modifiedThisWeek,
            modifiedThisMonth,
        };

        return NextResponse.json(stats);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to analyze folder' }, { status: 500 });
    }
}
