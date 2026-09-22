import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const helper = fileURLToPath(new URL('../scripts/lib/render-deploy.ps1', import.meta.url)).replaceAll("'", "''");
const sha = 'a'.repeat(40);
const deploy = { id: 'dep-test123', status: 'live', commit: { id: sha } };
const windowsOnly = { skip: process.platform !== 'win32' };

function resolve(response, expected = '') {
  const json = JSON.stringify(response).replaceAll("'", "''");
  return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    `$ErrorActionPreference='Stop'; . '${helper}'; $r = ConvertFrom-Json '${json}'; ` +
    `try { $d = Resolve-RenderDeploy -Response $r ${expected}; Write-Output ('OK:' + $d.id) } ` +
    `catch { Write-Output ('REJECT:' + $_.Exception.Message) }`
  ], { encoding: 'utf8', timeout: 15000 }).trim();
}

test('Render release accepts both direct and wrapped deploy responses', windowsOnly, () => {
  assert.equal(resolve(deploy), 'OK:dep-test123');
  assert.equal(resolve({ deploy, cursor: 'cursor' }), 'OK:dep-test123');
});

test('Render release rejects a deploy list containing an unrelated live release', windowsOnly, () => {
  assert.match(resolve([{ deploy: { ...deploy, status: 'build_in_progress' } }, { deploy }]), /^REJECT:/);
});

test('Render release rejects missing IDs and wrong commits or deploy IDs', windowsOnly, () => {
  assert.match(resolve({ ...deploy, id: '' }), /^REJECT:/);
  assert.match(resolve({ ...deploy, commit: {} }), /^REJECT:/);
  assert.match(resolve(deploy, "-ExpectedId 'dep-other'"), /^REJECT:/);
  assert.match(resolve(deploy, `-ExpectedCommit '${'b'.repeat(40)}'`), /^REJECT:/);
  assert.equal(resolve({ deploy }, `-ExpectedId '${deploy.id}' -ExpectedCommit '${sha}'`), 'OK:dep-test123');
});
