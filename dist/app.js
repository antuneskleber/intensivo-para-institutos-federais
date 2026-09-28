const $ = (s) => document.querySelector(s);
const app = $('#app');
const STORAGE_KEY = 'aklabs-intensivo-if-v1';
let currentReportContext = null;
const initial = {state:'',institution:'',level:'integrado',answered:0,correct:0,errors:[],bySubject:{}};
const progress = Object.assign(initial, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
const data = window.IF_DATA;

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  if(window.cloudSync && typeof window.cloudSync.scheduleSave === 'function'){
    window.cloudSync.scheduleSave(progress);
  }
}
function toast(message){
  const el=$('#toast');
  if(!el) return;
  el.textContent=message;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),2200);
}
window.toast = toast;

function openReportModal(context = null){
  currentReportContext = context;
  const container = $('#reportModalContainer');
  const questionInfo = context?.question ? `<div class="report-context"><strong>Questão selecionada</strong><span>${context.question}</span></div>` : '';
  container.innerHTML = `<div class="report-overlay" role="dialog" aria-modal="true" aria-labelledby="reportTitle"><form id="reportForm" class="report-modal"><div class="report-modal-head"><div><span class="eyebrow">Ajude a melhorar</span><h2 id="reportTitle">Reportar um problema</h2></div><button class="report-close" type="button" aria-label="Fechar">&times;</button></div>${questionInfo}<label>Motivo<select name="category" required><option value="">Selecione</option><option value="question">Erro em uma questão</option><option value="answer">Gabarito incorreto</option><option value="content">Conteúdo ou texto</option><option value="technical">Falha técnica</option><option value="accessibility">Acessibilidade</option><option value="other">Outro motivo</option></select></label><label>Descreva o problema<textarea name="message" rows="5" maxlength="1500" required placeholder="Conte o que aconteceu e, se possível, como reproduzir."></textarea></label><small>O relato será enviado à administração com a tela e a questão relacionadas.</small><div class="report-actions"><button class="btn light report-cancel" type="button">Cancelar</button><button class="btn primary" type="submit">Enviar relato</button></div></form></div>`;
  const close = () => { container.innerHTML=''; currentReportContext=null; };
  container.querySelector('.report-close').onclick=close;
  container.querySelector('.report-cancel').onclick=close;
  container.querySelector('.report-overlay').onclick=(event)=>{ if(event.target===event.currentTarget)close(); };
  container.querySelector('#reportForm').onsubmit=async(event)=>{
    event.preventDefault();
    const submit=event.submitter; submit.disabled=true; submit.textContent='Enviando...';
    try {
      if(!window.cloudSync?.isReady()) throw new Error('Faça login com o Google antes de enviar o relato.');
      const form=new FormData(event.currentTarget);
      await window.cloudSync.submitReport({category:form.get('category'),message:String(form.get('message')||'').trim(),page:location.hash||'#home',question:currentReportContext?.question||'',institution:currentReportContext?.institution||'',exam:currentReportContext?.exam||''});
      close(); toast('Relato enviado para a administração. Obrigado!');
    } catch(error) {
      toast(error.message||'Não foi possível enviar o relato.');
      submit.disabled=false; submit.textContent='Enviar relato';
    }
  };
  container.querySelector('select').focus();
}
window.openReportModal=openReportModal;
window.getProgressState = () => progress;
window.applyCloudProgress = (cloudProgress) => {
  Object.assign(progress, cloudProgress);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  if(typeof window.refreshRoute === 'function'){
    window.refreshRoute();
  }
};
function questionPool(){ return data.questions; }
let currentRouteName = 'home', currentRouteArg = null;
function route(name,arg){
  currentRouteName = name || 'home';
  currentRouteArg = arg;
  if(!window.cloudSync?.isReady()){
    loginRequired(); app.focus(); $('#nav').classList.remove('open'); return;
  }
  const pages={home,study,exams,progress:progressPage,quiz};
  (pages[name]||home)(arg); app.focus(); $('#nav').classList.remove('open');
}
window.refreshRoute = () => route(currentRouteName, currentRouteArg);
document.addEventListener('click',e=>{const b=e.target.closest('[data-route]'); if(b) route(b.dataset.route,b.dataset.arg);});
$('#menuBtn').onclick=()=>$('#nav').classList.toggle('open');
$('#reportProblemBtn').onclick=()=>openReportModal();

function home(){
  const user=window.cloudSync?.getUser?.(); const rate=progress.answered?Math.round(progress.correct/progress.answered*100):0;
  app.innerHTML=`<div class="shell">
    <section class="welcome">
      <div><span class="eyebrow">Preparação nacional para os Institutos Federais</span><h1>Estude para conquistar sua vaga.</h1><p>Questões reais por área, acervo de provas oficiais e acompanhamento do seu desempenho em um único lugar.</p><div class="actions"><button class="btn primary" data-route="quiz">Começar simulado</button><button class="btn light" data-route="exams">Ver provas anteriores</button></div></div>
      <aside class="profile-card"><span class="profile-label">Acesso conectado</span><strong>${user?.displayName||'Estudante IFintenso'}</strong><span>${user?.email||'Progresso sincronizado com sua conta Google'}</span></aside>
    </section>
    <section class="metrics" aria-label="Resumo do progresso"><div><strong>${progress.answered}</strong><span>questões respondidas</span></div><div><strong>${rate}%</strong><span>taxa de acerto</span></div><div><strong>${questionPool().length}</strong><span>questões disponíveis</span></div></section>
    <div class="section-title"><div><span class="eyebrow">Seu caminho</span><h2>O que fazer agora</h2></div></div>
    <section class="cards"><button class="feature" data-route="study"><span class="feature-number">01</span><h3>Estudar por matéria</h3><p>Escolha a área e pratique com explicações imediatas.</p></button><button class="feature featured" data-route="quiz"><span class="feature-number">02</span><h3>Simulado geral</h3><p>Pratique com as questões disponíveis dos Institutos Federais.</p></button><button class="feature" data-route="exams"><span class="feature-number">03</span><h3>Provas reais</h3><p>Acesse cadernos e gabaritos publicados pelas instituições.</p></button></section>
  </div>`;
}

function loginRequired(){
  app.innerHTML=`<div class="shell narrow"><section class="login-gate"><span class="login-gate-mark">IF</span><span class="eyebrow">Acesso ao IFintenso</span><h1>Entre para começar seus estudos.</h1><p>O login com Google é obrigatório para proteger seu progresso, sincronizar seus resultados e permitir suporte pela administração.</p><button id="gateGoogleLogin" class="btn primary" type="button">Entrar com Google</button><small>Seu desempenho ficará vinculado à sua conta e disponível em qualquer dispositivo.</small></section></div>`;
  $('#gateGoogleLogin').onclick=()=>$('#loginBtn').click();
}

function study(){
  const subjects=[...new Set(questionPool().map(q=>q.subject))];
  app.innerHTML=`<div class="shell"><div class="section-title"><div><span class="eyebrow">Banco geral</span><h1>Escolha uma área</h1><p>Pratique com todo o conteúdo disponível no IFintenso.</p></div></div><section class="subject-grid">${subjects.map((s,i)=>`<button class="subject" data-route="quiz" data-arg="${s}"><span>0${i+1}</span><h2>${s}</h2><p>${questionPool().filter(q=>q.subject===s).length} questões disponíveis</p></button>`).join('')}</section></div>`;
}

function quiz(subject){
  let pool=questionPool().filter(q=>!subject||q.subject===subject); pool=pool.sort(()=>Math.random()-.5).slice(0,Math.min(subject?5:10,pool.length));
  app.innerHTML=`<div class="shell narrow"><div class="section-title"><div><span class="eyebrow">${subject||'Simulado geral'}</span><h1>${pool.length} questões para avançar</h1><p>Responda tudo e receba a explicação de cada item.</p></div></div><form id="quizForm">${pool.map((q,n)=>`<article class="question"><div class="question-meta"><span>${q.subject}</span><span>${q.institution||q.region}</span></div><h2>${n+1}. ${q.text}</h2><div class="options">${q.options.map((o,i)=>`<label><input type="radio" name="q${n}" value="${i}"><span>${q.optionLabels?.[i]||String.fromCharCode(65+i)}</span>${o}</label>`).join('')}</div><button class="report-question" type="button" data-report-question="${n}">⚑ Reportar esta questão</button></article>`).join('')}<button class="btn primary submit" type="submit">Finalizar simulado</button></form></div>`;
  document.querySelectorAll('[data-report-question]').forEach(button=>button.onclick=()=>{const q=pool[Number(button.dataset.reportQuestion)];openReportModal({question:q.text,institution:q.institution,exam:q.exam});});
  $('#quizForm').onsubmit=e=>{e.preventDefault(); const answers=pool.map((q,n)=>e.target.elements['q'+n]?.value); if(answers.some(x=>x===undefined||x===''))return toast('Responda todas as questões.'); let hits=0; pool.forEach((q,n)=>{const ok=Number(answers[n])===q.answer; if(ok)hits++; progress.answered++; progress.correct+=ok?1:0; progress.bySubject[q.subject]=progress.bySubject[q.subject]||{answered:0,correct:0}; progress.bySubject[q.subject].answered++; progress.bySubject[q.subject].correct+=ok?1:0; if(!ok)progress.errors.unshift({text:q.text,answer:q.options[q.answer],explanation:q.explanation});}); progress.errors=progress.errors.slice(0,20); save(); result(pool,answers,hits);};
}

function result(pool,answers,hits){
  app.innerHTML=`<div class="shell narrow"><section class="result-head"><span class="eyebrow">Resultado</span><strong>${hits}/${pool.length}</strong><h1>${hits/pool.length>=.7?'Ótimo ritmo. Continue assim.':'Seu próximo estudo já está claro.'}</h1></section><div class="review">${pool.map((q,n)=>{const ok=Number(answers[n])===q.answer;return `<article class="review-item ${ok?'ok':'bad'}"><span>${ok?'Acertou':'Revise'}</span><h3>${q.text}</h3><p><b>Resposta:</b> ${q.options[q.answer]}</p><p>${q.explanation}</p>${q.source?`<small>${q.source}</small>`:''}</article>`}).join('')}</div><div class="actions"><button class="btn primary" data-route="quiz">Novo simulado</button><button class="btn light" data-route="progress">Ver progresso</button></div></div>`;
}

function exams(){
  const sources=[...new Map(Object.values(data.sources).flat().map(source=>[source.url,source])).values()];
  app.innerHTML=`<div class="shell"><div class="section-title"><div><span class="eyebrow">Acervo oficial nacional</span><h1>Provas e gabaritos dos Institutos Federais</h1><p>Os links levam aos portais das próprias instituições. Confirme sempre o edital do processo seletivo atual.</p></div></div><section class="exam-list">${sources.map(s=>`<a class="exam" href="${s.url}" target="_blank" rel="noopener"><div><span>${s.institution}</span><h2>${s.title}</h2><p>${s.detail}</p></div><strong>Ver acervo ↗</strong></a>`).join('')}</section></div>`;
}

function progressPage(){
  const rate=progress.answered?Math.round(progress.correct/progress.answered*100):0; const rows=Object.entries(progress.bySubject);
  app.innerHTML=`<div class="shell"><div class="section-title"><div><span class="eyebrow">Desempenho sincronizado</span><h1>Seu progresso</h1><p>Seus dados são vinculados à conta Google e sincronizados com segurança.</p></div></div><section class="metrics large"><div><strong>${progress.answered}</strong><span>respondidas</span></div><div><strong>${progress.correct}</strong><span>acertos</span></div><div><strong>${rate}%</strong><span>aproveitamento</span></div></section><section class="progress-layout"><article class="panel"><h2>Por área</h2>${rows.length?rows.map(([s,v])=>{const p=Math.round(v.correct/v.answered*100);return `<div class="subject-progress"><div><b>${s}</b><span>${p}%</span></div><i><em style="width:${p}%"></em></i></div>`}).join(''):'<p class="muted">Faça seu primeiro simulado para ver a análise por área.</p>'}</article><article class="panel"><h2>Erros recentes</h2>${progress.errors.length?progress.errors.slice(0,4).map(e=>`<details><summary>${e.text}</summary><p><b>Resposta:</b> ${e.answer}<br>${e.explanation}</p></details>`).join(''):'<p class="muted">Nenhum erro registrado ainda.</p>'}</article></section></div>`;
}
route('home');
