import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../../base/logging';

export interface WorkspaceInfo {
    language: string;
    files: string[];
    dependencies: Record<string, string>;
    mainFile?: string;
    hasPackageJson: boolean;
    hasTsConfig: boolean;
    projectStructure: ProjectStructure;
}

export interface ProjectStructure {
    directories: string[];
    keyFiles: string[];
    testFiles: string[];
}

export class WorkspaceAnalyzer {
    private static instance: WorkspaceAnalyzer;
    private cachedInfo: Map<string, WorkspaceInfo> = new Map();
    private cacheTimeout: number = 60000;
    private lastAnalysisTime: Map<string, number> = new Map();

    private constructor() {}

    public static getInstance(): WorkspaceAnalyzer {
        if (!WorkspaceAnalyzer.instance) {
            WorkspaceAnalyzer.instance = new WorkspaceAnalyzer();
        }
        return WorkspaceAnalyzer.instance;
    }

    public async analyzeWorkspace(workspaceFolder: vscode.WorkspaceFolder): Promise<WorkspaceInfo> {
        const uri = workspaceFolder.uri.fsPath;
        const now = Date.now();
        
        if (this.isCacheValid(uri)) {
            return this.cachedInfo.get(uri)!;
        }

        const info: WorkspaceInfo = {
            language: this.detectPrimaryLanguage(workspaceFolder),
            files: await this.listAllFiles(workspaceFolder.uri),
            dependencies: this.extractDependencies(workspaceFolder),
            hasPackageJson: this.fileExists(workspaceFolder, 'package.json'),
            hasTsConfig: this.fileExists(workspaceFolder, 'tsconfig.json'),
            projectStructure: this.analyzeStructure(workspaceFolder)
        };

        info.mainFile = this.findMainFile(workspaceFolder, info);

        this.cachedInfo.set(uri, info);
        this.lastAnalysisTime.set(uri, now);

        return info;
    }

    private isCacheValid(uri: string): boolean {
        const lastTime = this.lastAnalysisTime.get(uri);
        if (!lastTime) return false;
        return (Date.now() - lastTime) < this.cacheTimeout;
    }

    private detectPrimaryLanguage(workspaceFolder: vscode.WorkspaceFolder): string {
        const files = fs.readdirSync(workspaceFolder.uri.fsPath);
        const languageCounts: Record<string, number> = {};
        
        const extensionMap: Record<string, string> = {
            '.ts': 'TypeScript',
            '.js': 'JavaScript',
            '.tsx': 'TypeScript',
            '.jsx': 'JavaScript',
            '.py': 'Python',
            '.go': 'Go',
            '.java': 'Java',
            '.rs': 'Rust',
            '.cpp': 'C++',
            '.c': 'C',
            '.cs': 'C#',
            '.rb': 'Ruby',
            '.php': 'PHP'
        };

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            const language = extensionMap[ext];
            if (language) {
                languageCounts[language] = (languageCounts[language] || 0) + 1;
            }
        }

        let maxCount = 0;
        let primaryLanguage = 'Unknown';
        
        for (const [language, count] of Object.entries(languageCounts)) {
            if (count > maxCount) {
                maxCount = count;
                primaryLanguage = language;
            }
        }

        return primaryLanguage;
    }

    private async listAllFiles(uri: vscode.Uri): Promise<string[]> {
        const files: string[] = [];
        
        try {
            const walkDir = (dir: string) => {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        if (!item.startsWith('.') && !item.startsWith('node_modules')) {
                            walkDir(fullPath);
                        }
                    } else {
                        files.push(fullPath);
                    }
                }
            };
            
            walkDir(uri.fsPath);
        } catch (error) {
            logger.error('Error listing files:', error as Error);
        }

        return files;
    }

    private extractDependencies(workspaceFolder: vscode.WorkspaceFolder): Record<string, string> {
        const dependencies: Record<string, string> = {};
        
        const packageJsonPath = path.join(workspaceFolder.uri.fsPath, 'package.json');
        if (this.fileExists(workspaceFolder, 'package.json')) {
            try {
                const content = fs.readFileSync(packageJsonPath, 'utf8');
                const packageJson = JSON.parse(content);
                
                Object.assign(dependencies, packageJson.dependencies || {});
                Object.assign(dependencies, packageJson.devDependencies || {});
            } catch (error) {
                logger.error('Error reading package.json:', error as Error);
            }
        }

        const requirementsPath = path.join(workspaceFolder.uri.fsPath, 'requirements.txt');
        if (fs.existsSync(requirementsPath)) {
            try {
                const content = fs.readFileSync(requirementsPath, 'utf8');
                const lines = content.split('\n');
                for (const line of lines) {
                    const match = line.match(/^([a-zA-Z0-9_-]+)/);
                    if (match) {
                        dependencies[match[1]] = 'latest';
                    }
                }
            } catch (error) {
                logger.error('Error reading requirements.txt:', error as Error);
            }
        }

        const goModPath = path.join(workspaceFolder.uri.fsPath, 'go.mod');
        if (fs.existsSync(goModPath)) {
            try {
                const content = fs.readFileSync(goModPath, 'utf8');
                const lines = content.split('\n');
                for (const line of lines) {
                    const match = line.match(/^require\s+\((.*?)\)/);
                    if (match) {
                        const deps = match[1].split('\n');
                        for (const dep of deps) {
                            const depMatch = dep.trim().match(/^([a-zA-Z0-9/_-]+)\s+v?([0-9.]+)/);
                            if (depMatch) {
                                dependencies[depMatch[1]] = depMatch[2];
                            }
                        }
                    }
                }
            } catch (error) {
                logger.error('Error reading go.mod:', error as Error);
            }
        }

        return dependencies;
    }

    private analyzeStructure(workspaceFolder: vscode.WorkspaceFolder): ProjectStructure {
        const directories: string[] = [];
        const keyFiles: string[] = [];
        const testFiles: string[] = [];

        const importantDirs = ['src', 'lib', 'utils', 'helpers', 'components', 'controllers', 'models', 'views', 'tests', '__tests__'];
        const importantFiles = ['index.ts', 'index.js', 'main.ts', 'main.js', 'app.ts', 'app.js', 'server.ts', 'server.js'];

        try {
            const rootItems = fs.readdirSync(workspaceFolder.uri.fsPath);
            
            for (const item of rootItems) {
                const fullPath = path.join(workspaceFolder.uri.fsPath, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    if (importantDirs.includes(item)) {
                        directories.push(item);
                    }
                } else {
                    if (importantFiles.includes(item)) {
                        keyFiles.push(item);
                    }
                    if (item.includes('test') || item.includes('.spec.') || item.includes('.test.')) {
                        testFiles.push(item);
                    }
                }
            }
        } catch (error) {
            logger.error('Error analyzing structure:', error as Error);
        }

        return { directories, keyFiles, testFiles };
    }

    private findMainFile(workspaceFolder: vscode.WorkspaceFolder, info: WorkspaceInfo): string | undefined {
        const structure = info.projectStructure;
        
        for (const file of structure.keyFiles) {
            const fullPath = path.join(workspaceFolder.uri.fsPath, file);
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
        }

        if (info.language === 'TypeScript' || info.language === 'JavaScript') {
            const srcIndex = path.join(workspaceFolder.uri.fsPath, 'src', 'index.ts');
            if (fs.existsSync(srcIndex)) {
                return srcIndex;
            }
        }

        return undefined;
    }

    private fileExists(workspaceFolder: vscode.WorkspaceFolder, fileName: string): boolean {
        const filePath = path.join(workspaceFolder.uri.fsPath, fileName);
        return fs.existsSync(filePath);
    }

    public async getFileContent(filePath: string): Promise<string> {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            logger.error('Error reading file:', error as Error);
            return '';
        }
    }

    public async getMultipleFilesContent(filePaths: string[]): Promise<Map<string, string>> {
        const contentMap = new Map<string, string>();
        
        for (const filePath of filePaths.slice(0, 10)) {
            const content = await this.getFileContent(filePath);
            if (content) {
                contentMap.set(filePath, content);
            }
        }

        return contentMap;
    }

    public clearCache(): void {
        this.cachedInfo.clear();
        this.lastAnalysisTime.clear();
    }

    public dispose(): void {
        this.clearCache();
    }
}

export const workspaceAnalyzer = WorkspaceAnalyzer.getInstance();
