import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../dist/data.js', import.meta.url), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox);
const data = sandbox.window.IF_DATA;
const errors = [];

if (data.states.length !== 27) errors.push(`Esperadas 27 UFs; recebidas ${data.states.length}.`);
for (const q of data.questions) {
  if (!q.text || !Array.isArray(q.options) || q.options.length < 1 || q.options.length > 26) errors.push(`Questão inválida: ${q.text || '(sem texto)'}`);
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) errors.push(`Gabarito inválido: ${q.text}`);
  if (!q.explanation) errors.push(`Explicação ausente: ${q.text}`);
  if (!q.institution || !q.exam || !q.source) errors.push(`Rastreabilidade ausente: ${q.text}`);
  if (q.optionLabels && q.optionLabels.length !== q.options.length) errors.push(`Rótulos de alternativas inválidos: ${q.text}`);
}
if (data.questions.length !== 3) errors.push(`Esperadas as 3 questões do compilado; recebidas ${data.questions.length}.`);
for (const [uf, sources] of Object.entries(data.sources)) {
  for (const source of sources) if (!source.url.startsWith('https://')) errors.push(`Fonte sem HTTPS em ${uf}.`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Conteúdo válido: ${data.states.length} UFs, ${data.questions.length} questões e ${Object.values(data.sources).flat().length} fontes oficiais.`);
