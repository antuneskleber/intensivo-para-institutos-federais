import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = relative => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const index = read('dist/index.html');
const app = read('dist/app.js');
const auth = read('dist/auth.js');
const admin = read('dist/admin.js');
const adminHtml = read('dist/admin.html');
const firebaseConfig = read('dist/firebase-config.js');
const rules = read('firestore.rules');

assert.match(index, /id="reportProblemBtn"/, 'Botão global de relato ausente.');
assert.match(app, /data-report-question/, 'Atalho contextual por questão ausente.');
assert.match(auth, /submitReport/, 'Envio de relato ao Firebase ausente.');
assert.match(auth, /collection\(db, "reports"\)/, 'Coleção reports não configurada no cliente.');
assert.match(adminHtml, /id="reportsList"/, 'Central de relatos ausente no painel.');
assert.match(admin, /toggleReportStatus/, 'Fluxo de tratamento dos relatos ausente.');
assert.match(rules, /match \/reports\/\{reportId\}/, 'Regras da coleção reports ausentes.');
assert.match(firebaseConfig, /mariecristinefortesrocha@gmail\.com/, 'Administradora de leitura ausente na configuração.');
assert.match(rules, /function isReadOnlyAdmin\(\)/, 'Papel administrativo somente leitura ausente.');
assert.match(rules, /allow read: if canViewAdminPanel\(\)/, 'Leitura administrativa de relatos não está protegida.');
assert.match(rules, /allow update, delete: if isFullAdmin\(\)/, 'Alterações de relatos não estão restritas ao administrador completo.');
assert.match(rules, /!isReadOnlyAdmin\(\) && request\.auth\.uid == userId/, 'Conta somente leitura ainda pode alterar atributos de usuário.');
assert.match(admin, /if \(!currentCanWrite\) return toast/, 'Bloqueio defensivo de escrita ausente no painel.');
assert.match(adminHtml, /id="readOnlyBanner"/, 'Aviso de modo somente leitura ausente.');
assert.match(app, /function loginRequired\(\)/, 'Tela de login obrigatório ausente.');
assert.match(app, /if\(!window\.cloudSync\?\.isReady\(\)\)/, 'Rotas não estão protegidas por autenticação.');
assert.doesNotMatch(app, /id="stateSelect"/, 'A seleção regional antiga foi reintroduzida.');
assert.doesNotMatch(app, /function setup\(\)/, 'Fluxo antigo de configuração regional ainda existe.');

console.log('Fluxo de relatos válido: usuário, Firestore e painel administrativo conectados.');
