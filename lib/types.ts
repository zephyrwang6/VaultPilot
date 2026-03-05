// VaultPilot types

export interface VaultConfig {
    vaultPath: string;
    boundAt: string; // ISO date
    panels?: PanelConfig[];
}

export interface PanelConfig {
    id: string;
    label: string;
    icon: string; // lucide icon name
    type: 'folder' | 'stats' | 'custom';
    path?: string; // folder path relative to vault
    description?: string;
}

export interface SkillInfo {
    name: string;
    description: string;
    category: string;
    path: string;
}

export interface VaultFolder {
    name: string;
    path: string;
    children: VaultFolder[];
    fileCount: number;
}
