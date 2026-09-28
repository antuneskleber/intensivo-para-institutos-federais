import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = relative => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const index = read('dist/index.html');
const app = read('dist/app.js');
const auth = read('dist/auth.js');
const admin = read('dist/admin.js');
const adminHtml = read('dist/admin.html');
const rules = read('firestore.rules');

assert.match(index, /id="reportProblemBtn"/, 'Botão global de relato ausente.');
assert.match(app, /data-report-question/, 'Atalho contextual por questão ausente.');
assert.match(auth, /submitReport/, 'Envio de relato ao Firebase ausente.');
assert.match(auth, /collection\(db, "reports"\)/, 'Coleção reports não configurada no cliente.');
assert.match(adminHtml, /id="reportsList"/, 'Central de relatos ausente no painel.');
assert.match(admin, /toggleReportStatus/, 'Fluxo de tratamento dos relatos ausente.');
assert.match(rules, /match \/reports\/\{reportId\}/, 'Regras da coleção reports ausentes.');
assert.match(rules, /allow read, update, delete: if isAdmin\(\)/, 'Acesso administrativo aos relatos não está protegido.');

console.log('Fluxo de relatos válido: usuário, Firestore e painel administrativo conectados.');
