import fs from 'node:fs';
import path from 'node:path';
import { computeContentHash } from '../utils/hash.js';

const MANIFEST_FILENAME = '.dto-gen.manifest.json';

type Manifest = Record<string, string>;

export class ManifestManager {
  private manifestPath: string;
  private manifest: Manifest;

  constructor(outputDir: string) {
    this.manifestPath = path.join(outputDir, MANIFEST_FILENAME);
    this.manifest = this.load();
  }

  private load(): Manifest {
    if (!fs.existsSync(this.manifestPath)) return {};
    const raw = fs.readFileSync(this.manifestPath, 'utf-8');
    return JSON.parse(raw) as Manifest;
  }

  save(): void {
    const sorted = Object.keys(this.manifest).sort().reduce<Manifest>((acc, key) => {
      acc[key] = this.manifest[key];
      return acc;
    }, {});
    fs.writeFileSync(this.manifestPath, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
  }

  has(filename: string): boolean {
    return filename in this.manifest;
  }

  hashMatches(filename: string, filePath: string): boolean {
    if (!this.has(filename)) return false;
    if (!fs.existsSync(filePath)) return false;
    const diskContent = fs.readFileSync(filePath, 'utf-8');
    const diskHash = computeContentHash(diskContent);
    return this.manifest[filename] === diskHash;
  }

  set(filename: string, content: string): void {
    this.manifest[filename] = computeContentHash(content);
  }

  setFromDisk(filename: string, filePath: string): void {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf-8');
    this.manifest[filename] = computeContentHash(content);
  }

  remove(filename: string): void {
    delete this.manifest[filename];
  }

  get entries(): [string, string][] {
    return Object.entries(this.manifest);
  }
}
