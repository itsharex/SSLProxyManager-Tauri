import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readCargoVersion(cargoTomlPath) {
  const txt = fs.readFileSync(cargoTomlPath, 'utf8');
  const m = txt.match(/^version\s*=\s*"([^"]+)"/m);
  if (!m) throw new Error(`无法从 ${cargoTomlPath} 解析 version`);
  return m[1];
}

function syncTauriConf(tauriConfPath, version) {
  const raw = fs.readFileSync(tauriConfPath, 'utf8');
  const json = JSON.parse(raw);
  const old = json.version;
  if (old === version) {
    return { changed: false, old };
  }
  json.version = version;
  fs.writeFileSync(tauriConfPath, JSON.stringify(json, null, 2) + '\n', 'utf8');
  return { changed: true, old };
}

const cargoToml = path.join(root, 'Cargo.toml');
const tauriConf = path.join(root, 'tauri.conf.json');

const version = readCargoVersion(cargoToml);
const r = syncTauriConf(tauriConf, version);

if (r.changed) {
  console.log(`tauri.conf.json version: ${r.old} -> ${version}`);
} else {
  console.log(`tauri.conf.json version 已是 ${version}`);
}
