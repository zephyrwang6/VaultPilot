import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execFileAsync = promisify(execFile);
const SKILLS_PATH = path.join(process.env.HOME || '/Users/ugreen', '.claude', 'skills');

function parseFrontmatter(content: string): { name: string; description: string } {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return { name: '', description: '' };
    const fm = match[1];
    const nameMatch = fm.match(/^name:\s*(.+)$/m);
    let description = '';
    const descSingle = fm.match(/^description:\s*(?!>)(.+)$/m);
    if (descSingle) {
        description = descSingle[1].trim();
    } else {
        const descMulti = fm.match(/^description:\s*>\s*\n([\s\S]*?)(?=\n\w|\n---)/m);
        if (descMulti) description = descMulti[1].split('\n').map(l => l.trim()).filter(Boolean).join(' ');
    }
    return { name: nameMatch ? nameMatch[1].trim() : '', description: description.slice(0, 200) };
}

function guessCategory(name: string, desc: string): string {
    const t = `${name} ${desc}`.toLowerCase();
    if (t.includes('mem-') || t.includes('记忆')) return '记忆系统';
    if (t.includes('topic') || t.includes('选题') || t.includes('热点')) return '选题管理';
    if (t.includes('podcast') || t.includes('youtube') || t.includes('播客')) return '内容采集';
    if (t.includes('content') || t.includes('digest') || t.includes('article') || t.includes('文章')) return '内容创作';
    if (t.includes('doc') || t.includes('writing') || t.includes('coauthor')) return '写作';
    if (t.includes('image') || t.includes('logo') || t.includes('canvas') || t.includes('design')) return '视觉设计';
    if (t.includes('task') || t.includes('start-work') || t.includes('工作')) return '任务管理';
    if (t.includes('pdf') || t.includes('pptx') || t.includes('xlsx') || t.includes('docx')) return '文档工具';
    if (t.includes('web') || t.includes('frontend') || t.includes('mcp')) return '开发工具';
    return '其他';
}

async function getClaudeSkills() {
    const entries = await fs.readdir(SKILLS_PATH, { withFileTypes: true });
    const skills = [];
    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        try {
            const content = await fs.readFile(path.join(SKILLS_PATH, entry.name, 'SKILL.md'), 'utf-8');
            const { name, description } = parseFrontmatter(content);
            if (name || description) {
                skills.push({
                    name: name || entry.name,
                    description: description || '',
                    category: guessCategory(name || entry.name, description),
                    path: entry.name,
                });
            }
        } catch { /* skip */ }
    }
    skills.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    return skills;
}

async function getOpenClawSkills() {
    try {
        const { stdout } = await execFileAsync('openclaw', ['agents', 'list', '--json'], { timeout: 15_000 });
        const agents = JSON.parse(stdout);
        return (Array.isArray(agents) ? agents : []).map((a: any) => ({
            name: a.name || a.id || 'unknown',
            description: a.description || '',
            category: a.category || 'Agent',
            path: a.id || a.name || '',
        }));
    } catch {
        return [];
    }
}

export async function GET(request: NextRequest) {
    const agent = request.nextUrl.searchParams.get('agent') || 'claude-code';

    try {
        const skills = agent === 'openclaw'
            ? await getOpenClawSkills()
            : await getClaudeSkills();
        return NextResponse.json(skills);
    } catch {
        return NextResponse.json([]);
    }
}
