import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readCargoVersion(cargoTomlPath) {
  const txt = fs.readFileSync(cargoTomlPath, 'utf8');
  const m = txt.match(/^version\s*=\s*"([^"]+)"/m);
  if (!m) throw new Error(`无法从 ${cargoTomlPath} 解析 version`);
  return m[1];
}

function syncJsonFile(filePath, version) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(raw);
  const old = json.version;
  if (old === version) {
    return { changed: false, old };
  }
  json.version = version;
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
  return { changed: true, old };
}

const cargoToml = path.join(root, 'Cargo.toml');
const tauriConf = path.join(root, 'tauri.conf.json');
const packageJson = path.join(root, 'package.json');

const version = readCargoVersion(cargoToml);

// Sync tauri.conf.json
const rTauri = syncJsonFile(tauriConf, version);
if (rTauri.changed) {
  console.log(`tauri.conf.json version: ${rTauri.old} -> ${version}`);
} else {
  console.log(`tauri.conf.json version 已是 ${version}`);
}

// Sync package.json
const rPkg = syncJsonFile(packageJson, version);
if (rPkg.changed) {
  console.log(`package.json version: ${rPkg.old} -> ${version}`);
} else {
  console.log(`package.json version 已是 ${version}`);
}
