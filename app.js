(function(){
"use strict";
const DIAS=[['seg','Segunda','Seg'],['ter','Terça','Ter'],['qua','Quarta','Qua'],['qui','Quinta','Qui'],['sex','Sexta','Sex'],['sab','Sábado','Sáb'],['dom','Domingo','Dom']];
const PO=['','u','a','l'];
const PRI={'':'Normal',u:'Não pode faltar',a:'Atenção',l:'Livre'};
const LIBS={
  pdf:{url:'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',ok:()=>window.jspdf&&window.jspdf.jsPDF},
  docx:{url:'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js',ok:()=>window.docx&&window.docx.Document},
  xlsx:{url:'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js',ok:()=>window.ExcelJS&&window.ExcelJS.Workbook}
};
const loading={};
function loadLib(k){
  const L=LIBS[k];if(L.ok())return Promise.resolve();
  if(loading[k])return loading[k];
  loading[k]=new Promise((res,rej)=>{
    const s=document.createElement('script');s.src=L.url;
    s.onload=()=>{L.ok()?res():(delete loading[k],rej(new Error('lib')))};
    s.onerror=()=>{delete loading[k];rej(new Error('lib'))};
    document.head.appendChild(s);
  });
  return loading[k];
}

const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const clone=o=>JSON.parse(JSON.stringify(o));
const uid=p=>(p||'x')+Math.random().toString(36).slice(2,8);
const nrm=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const fmtDate=iso=>{if(!iso)return '';const d=new Date(iso);return isNaN(d)?'':d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})};
const fmtFull=iso=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(iso||'');return m?m[3]+'/'+m[2]+'/'+m[1]:''};
const todayIso=()=>{const d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)};
const newId=()=>(window.crypto&&crypto.randomUUID)?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16)});
const lsGet=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};

/* ---------- estado ---------- */
const S={sb:null,user:null,list:[],cur:null,W:null,tab:'dieta',day:(new Date().getDay()+6)%7,
  save:'ok',dirty:false,saving:false,modal:null,rOpen:null,oriOpen:false,busy:null,loginErr:'',loading:false,q:'',
  exp:{cardapio:true,receitas:true,compras:true,orientacoes:true},exRead:[]};

/* ---------- modelo ---------- */
const blankMeal=(hora,nome,rotulo)=>({id:uid('m'),hora:hora||'',rotulo:rotulo||'',nome:nome||'',p:'',todos:[],dias:{}});
function lastCfg(){return lsGet('tissi:cfg',{})}
function blankPlan(nome,tipo){
  const cfg=lastCfg();
  return {v:3,tipo:tipo||'individual',paciente:nome||'',titulo:'Alimentação semanal',inicio:todayIso(),
    nutri:cfg.nutri||'Tissiana Ramos',registro:cfg.registro||'Nutricionista · CRN 2669',
    membros:tipo==='familia'?[{n:'',q:''}]:[],ficha:{},
    orientacoes:[],
    refeicoes:[blankMeal('','Em jejum','Ao acordar'),blankMeal('07:00','Café da manhã'),blankMeal('10:00','Lanche da manhã'),blankMeal('12:00','Almoço'),blankMeal('15:30','Lanche da tarde'),blankMeal('19:00','Jantar'),blankMeal('','Ceia','Antes de dormir')],
    receitas:[],compras:[],exames:[],examesNota:''};
}
function normalise(W){
  W.tipo=W.tipo||'individual';W.membros=W.membros||[];W.ficha=W.ficha||{};W.exames=W.exames||[];W.examesNota=W.examesNota||'';
  W.orientacoes=W.orientacoes||[];W.receitas=W.receitas||[];W.compras=W.compras||[];W.refeicoes=W.refeicoes||[];
  W.refeicoes.forEach(m=>{
    m.dias=m.dias||{};m.rotulo=m.rotulo||'';m.hora=m.hora||'';m.p=m.p||'';
    const td=m.todos||[],dp=m.depois||[];
    if(td.length||dp.length){
      DIAS.forEach(d=>{
        const opts=m.dias[d[0]];
        if(opts&&opts.length)m.dias[d[0]]=opts.map(o=>clone(td).concat(o,clone(dp)));
        else if(!opts&&td.length)m.dias[d[0]]=[clone(td).concat(clone(dp))];
      });
    }
    m.todos=[];m.depois=[];
  });
  return W;
}
function fromTemplate(t,nome,tipo){
  const base=blankPlan(nome,tipo||t.tipo),p=clone(t.plano);
  base.tipo=t.tipo||base.tipo;
  base.titulo=p.titulo||base.titulo;
  base.orientacoes=p.orientacoes||[];base.refeicoes=p.refeicoes||base.refeicoes;
  base.receitas=p.receitas||[];base.compras=p.compras||[];
  base.membros=base.tipo==='familia'?[{n:'',q:''}]:[];
  return normalise(base);
}

/* ---------- caminhos ---------- */
const getPath=p=>p.split('.').reduce((o,k)=>o==null?o:o[k],S.W);
const setPath=(p,v)=>{const a=p.split('.'),l=a.pop(),o=a.reduce((o,k)=>o[k],S.W);o[l]=v};

/* ---------- banco ---------- */
const DB={
  cfgOk:()=>{const c=window.TISSI_CONFIG||{};return !!(c.SUPABASE_URL&&c.SUPABASE_ANON_KEY&&window.supabase)},
  init(){const c=window.TISSI_CONFIG;S.sb=window.supabase.createClient(c.SUPABASE_URL,c.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}})},
  list:()=>S.sb.from('pacientes').select('id,nome,atualizado,tipo:plano->>tipo').order('nome',{ascending:true}).then(r=>{if(r.error)throw r.error;return r.data||[]}),
  get:id=>S.sb.from('pacientes').select('id,nome,plano,atualizado').eq('id',id).single().then(r=>{if(r.error)throw r.error;return r.data}),
  put:(id,W)=>S.sb.from('pacientes').upsert({id,nome:W.paciente||'Sem nome',plano:W,atualizado:new Date().toISOString()},{onConflict:'id'}).then(r=>{if(r.error)throw r.error}),
  del:id=>S.sb.from('pacientes').delete().eq('id',id).then(r=>{if(r.error)throw r.error})
};

/* ---------- salvar ---------- */
let timer=null,retry=null;
const bkKey=id=>'tissi:bk:'+id;
function touch(){
  if(!S.cur)return;
  S.dirty=true;S.save='saving';paintSave();
  lsSet(bkKey(S.cur),{t:Date.now(),W:S.W});
  clearTimeout(timer);timer=setTimeout(flush,700);
}
function flush(){
  clearTimeout(timer);
  if(!S.cur||!S.dirty)return Promise.resolve();
  if(S.saving){timer=setTimeout(flush,300);return Promise.resolve()}
  const id=S.cur,snap=JSON.stringify(S.W);S.saving=true;S.dirty=false;
  return DB.put(id,JSON.parse(snap)).then(()=>{
    S.saving=false;
    const it=S.list.filter(p=>p.id===id)[0];
    if(it){it.nome=S.W.paciente||'Sem nome';it.atualizado=new Date().toISOString()}
    lsSet('tissi:cfg',{nutri:S.W.nutri,registro:S.W.registro});
    if(!S.dirty){S.save='ok';try{localStorage.removeItem(bkKey(id))}catch(e){}}
    paintSave();
  }).catch(()=>{
    S.saving=false;S.dirty=true;S.save='err';paintSave();
    clearTimeout(retry);retry=setTimeout(()=>flush(),5000);
  });
}
function paintSave(){
  const el=$('save');if(!el)return;
  el.className='save'+(S.save==='err'?' err':'');
  el.textContent=S.save==='ok'?'Salvo ✓':S.save==='saving'?'Salvando…':'Não salvou';
  const bn=$('banner');if(bn)bn.hidden=S.save!=='err';
}
window.addEventListener('beforeunload',e=>{if(S.dirty||S.saving){e.preventDefault();e.returnValue=''}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});
window.addEventListener('online',()=>{if(S.dirty)flush()});

function toast(t,bad){
  const d=document.createElement('div');d.className='toast'+(bad?' bad':'');d.textContent=t;$('toasts').appendChild(d);
  setTimeout(()=>d.remove(),bad?4500:2400);
}

/* ---------- alimentos: busca e memória ---------- */
let IDX=null,IDXMAP=null;
function buildIdx(){
  IDX=[];IDXMAP=new Map();
  const push=(n,c,p,t)=>{const nn=nrm(n).trim();if(!nn||IDXMAP.has(nn))return;const it={n,nn,c,p:p||[],t:!!t};IDX.push(it);IDXMAP.set(nn,it)};
  ((window.BIBLIOTECA&&window.BIBLIOTECA.alimentos)||[]).forEach(a=>push(a[0],'Da Tissi',a[1],1));
  lsGet('tissi:foods',[]).forEach(a=>push(a[0],'Meus alimentos',a[1],1));
  (window.FOODS||[]).forEach(g=>g.i.forEach(x=>{if(Array.isArray(x))push(x[0],g.c,x[1]);else push(x,g.c,g.p)}));
}
function foodSearch(q){
  if(!IDX)buildIdx();
  const toks=nrm(q).trim().split(/\s+/).filter(Boolean);
  if(!toks.length){
    const seen=new Set(),out=[];
    recentFoods().forEach(n=>{const nn=nrm(n).trim();if(!seen.has(nn)){seen.add(nn);const it=IDXMAP.get(nn);out.push({n,c:it?it.c:'Neste plano'})}});
    return out.slice(0,8);
  }
  const res=[];
  for(const it of IDX){
    let ok=true;for(const t of toks){if(it.nn.indexOf(t)<0){ok=false;break}}
    if(!ok)continue;
    let s=it.nn.startsWith(toks[0])?0:((' '+it.nn).indexOf(' '+toks[0])>=0?1:2);
    if(it.t)s-=0.5;
    res.push({n:it.n,c:it.c,s:s+it.nn.length/200});
  }
  res.sort((a,b)=>a.s-b.s);
  return res.slice(0,12);
}
function recentFoods(){
  const out=[];
  if(!S.W)return out;
  S.W.refeicoes.forEach(m=>Object.keys(m.dias).forEach(k=>(m.dias[k]||[]).forEach(o=>o.forEach(it=>{const t=String(it.t||'').trim();if(t&&out.indexOf(t)<0)out.push(t)}))));
  return out.reverse();
}
const SHOPQ=['500 g','1 kg','2 kg','1 unidade','1 dúzia','1 pacote','1 caixa','1 maço','1 bandeja','1 pote','1 litro'];
function qtyFor(food){
  const nn=nrm(food).trim(),out=[],add=v=>{if(v&&out.indexOf(v)<0)out.push(v)};
  (lsGet('tissi:q',{})[nn]||[]).forEach(add);
  if(!IDX)buildIdx();
  const it=IDXMAP.get(nn);if(it)it.p.forEach(add);
  if(out.length<3)['1 unidade','1 colher de sopa','100 g','1 xícara'].forEach(add);
  return out.slice(0,8);
}
function learn(food,q){
  food=String(food||'').trim();q=String(q||'').trim();
  if(!food)return;
  if(!IDX)buildIdx();
  const nn=nrm(food).trim();
  if(!IDXMAP.has(nn)){
    const c=lsGet('tissi:foods',[]);
    if(!c.some(a=>nrm(a[0]).trim()===nn)){c.unshift([food,q?[q]:[]]);lsSet('tissi:foods',c.slice(0,400));buildIdx()}
  }
  if(q){
    const m=lsGet('tissi:q',{}),l=(m[nn]||[]).filter(x=>x!==q);l.unshift(q);m[nn]=l.slice(0,4);lsSet('tissi:q',m);
  }
}

/* popup de sugestões */
let SUG=null;
function sugEl(){let e=$('sug');if(!e){e=document.createElement('div');e.id='sug';e.hidden=true;document.body.appendChild(e);
  e.addEventListener('pointerdown',ev=>ev.preventDefault());
  e.addEventListener('click',ev=>{const b=ev.target.closest('[data-i]');if(b)applySug(+b.dataset.i)})}
  return e}
function hideSug(){SUG=null;const e=$('sug');if(e)e.hidden=true}
function foodOfRow(el){
  const p=el.dataset.bind,tp=p.replace(/\.q$/,'.t'),np=p.replace(/\.q$/,'.n');
  const v=getPath(tp);return v!=null&&v!==''&&p!==tp?v:getPath(np);
}
function showSug(el){
  const k=el.dataset.sug;let items=[];
  if(k==='food'||k==='shop')items=foodSearch(el.value).map(x=>({v:x.n,s:x.c}));
  else if(k==='qty')items=qtyFor(foodOfRow(el)).map(v=>({v}));
  else if(k==='shopq')items=SHOPQ.map(v=>({v}));
  if(!items.length)return hideSug();
  SUG={el,items,i:-1};paintSug();
}
function paintSug(){
  const e=sugEl(),{el,items,i}=SUG;
  e.className=el.dataset.sug==='qty'||el.dataset.sug==='shopq'?'chips':'list';
  e.innerHTML=items.map((it,n)=>`<button type="button" data-i="${n}" class="${n===i?'on':''}"><span>${esc(it.v)}</span>${it.s?`<small>${esc(it.s)}</small>`:''}</button>`).join('');
  e.hidden=false;posSug();
}
function posSug(){
  if(!SUG)return;
  const e=sugEl(),r=SUG.el.getBoundingClientRect(),vv=window.visualViewport,vh=vv?vv.height:innerHeight,off=vv?vv.offsetTop:0;
  const w=Math.max(r.width,Math.min(320,innerWidth-16));
  const below=vh-(r.bottom-off)-8,above=r.top-off-8;
  let left=Math.min(Math.max(8,r.left),innerWidth-w-8);
  e.style.width=w+'px';e.style.left=left+'px';
  if(below<200&&above>below){e.style.maxHeight=Math.min(300,above)+'px';e.style.top='auto';e.style.bottom=(innerHeight-r.top+4)+'px'}
  else{e.style.maxHeight=Math.min(300,Math.max(120,below))+'px';e.style.bottom='auto';e.style.top=(r.bottom+4)+'px'}
}
window.addEventListener('scroll',posSug,true);window.addEventListener('resize',posSug);
if(window.visualViewport)window.visualViewport.addEventListener('resize',posSug);
function applySug(n){
  if(!SUG)return;
  const {el,items}=SUG,v=items[n].v,k=el.dataset.sug;
  hideSug();
  setPath(el.dataset.bind,v);el.value=v;touch();
  const p=el.dataset.bind.split('.'),f=p.pop(),i=+p.pop(),arrPath=p.join('.');
  if(k==='food'||k==='shop'){
    const q=document.querySelector('[data-bind="'+arrPath+'.'+i+'.q"]');
    learn(v,'');if(q)q.focus();
  }else{
    learn(getPath(arrPath+'.'+i+'.'+(k==='qty'?'t':'n')),v);
    advance(arrPath,i,k==='qty'?'food':'shop');
  }
}
function advance(arrPath,i,kind){
  const arr=getPath(arrPath),fld=kind==='food'?'t':'n';
  if(i<arr.length-1){const nx=document.querySelector('[data-bind="'+arrPath+'.'+(i+1)+'.'+fld+'"]');if(nx)nx.focus();return}
  if(!String(arr[i][fld]||'').trim())return;
  arr.push(newItem(kind));touch();render(arrPath+'.'+(arr.length-1)+'.'+fld);
}

/* ---------- views ---------- */
function render(focus){
  hideSug();
  let h;
  if(!DB.cfgOk())h=vSetup();
  else if(!S.user)h=vLogin();
  else if(!S.cur)h=vList();
  else h=vPatient();
  const y=window.scrollY,key=(S.cur||'')+'|'+(S.user?1:0)+'|'+S.tab;
  const keep=$('app').dataset.scr===key;$('app').dataset.scr=key;
  $('app').innerHTML=h;
  $('modal').innerHTML=S.modal?vModal():'';
  if(keep)window.scrollTo(0,y);
  paintSave();
  if(focus){const el=document.querySelector('[data-bind="'+focus+'"]');if(el){el.focus({preventScroll:false})}}
  if(S.modal&&S.modal.focus){const m=document.querySelector(S.modal.focus);if(m)m.focus()}
}
const logo=(c)=>`<img class="${c||'logo'}" src="logo.png" alt="Tissiana Ramos Nutri" onerror="this.remove()">`;
function vSetup(){return '<div class="login"><h1>Falta configurar</h1><p class="muted">Abra o arquivo <b>config.js</b> e cole a URL e a chave do Supabase. O passo a passo está no README.</p></div>'}
function vLogin(){
  return `<form class="login" data-form="login">${logo('logo big')}<p class="muted">Entre para montar os planos das pacientes.</p>
  <label class="f" for="em">E-mail</label><input class="in" id="em" type="email" autocomplete="username" value="${esc(S.loginEm||'')}" required>
  <label class="f" for="pw">Senha</label><input class="in" id="pw" type="password" autocomplete="current-password" required>
  <div style="height:18px"></div><button class="btn primary big" type="submit"${S.loading?' disabled':''}>${S.loading?'Entrando…':'Entrar'}</button>
  ${S.loginErr?`<p class="err-t">${esc(S.loginErr)}</p>`:''}</form>`;
}
function vList(){
  let h=`<div class="wrap"><div class="hello"><div class="brand">${logo('logo sm')}<h1>Pacientes</h1></div><button class="lnk" data-act="logout">Sair</button></div>`;
  if(S.loading&&!S.list.length)h+='<p class="muted">Carregando…</p>';
  else if(!S.list.length)h+='<div class="empty"><p>Nenhuma paciente ainda.</p><button class="btn primary" data-act="new">+ Nova paciente</button></div>';
  else{
    h+='<button class="btn primary big" data-act="new" style="margin-bottom:14px">+ Nova paciente</button>';
    if(S.list.length>6)h+=`<input class="in" id="q" type="search" placeholder="Buscar paciente" value="${esc(S.q)}" style="margin-bottom:12px">`;
    const q=nrm(S.q).trim(),L=S.list.filter(p=>!q||nrm(p.nome).indexOf(q)>=0);
    h+=L.map(p=>`<div class="prow"><button class="pcard" data-act="open" data-id="${esc(p.id)}"><b>${esc(p.nome||'Sem nome')}</b><small>${p.tipo==='familia'?'Família · ':''}${esc(fmtDate(p.atualizado))}</small></button><button class="more" data-act="pmenu" data-id="${esc(p.id)}" aria-label="Opções">⋯</button></div>`).join('');
    if(!L.length)h+='<p class="muted">Ninguém com esse nome.</p>';
  }
  if(S.listErr)h+=`<p class="err-t">${esc(S.listErr)}</p>`;
  return h+'</div>';
}

const TABS=[['dieta','Dieta'],['rec','Receitas'],['comp','Compras'],['exa','Exames'],['ficha','Ficha']];
function vPatient(){
  let h=`<div class="top"><div class="in"><button class="back" data-act="back">‹ Pacientes</button><h1>${esc(S.W.paciente||'Nova paciente')}</h1><span class="save" id="save"></span><button class="btn primary" data-act="export">Baixar</button></div><div class="banner" id="banner" hidden>Não está salvando. Verifique a internet e não feche esta página.</div></div>`;
  h+='<div class="wrap"><div class="tabs">'+TABS.map(t=>`<button class="tab${S.tab===t[0]?' on':''}" data-act="tab" data-t="${t[0]}">${t[1]}</button>`).join('')+'</div>';
  h+={dieta:tDieta,rec:tRec,comp:tComp,exa:tExa,ficha:tFicha}[S.tab]();
  return h+'</div>';
}

function newItem(kind){return kind==='food'?{t:'',q:'',p:''}:{n:'',q:''}}
function rowsEd(path,arr,kind,o){
  o=o||{};let h='';
  arr.forEach((it,i)=>{
    const p=path+'.'+i,pr=kind==='food'?(it.p||''):'',k=kind==='food'?'t':'n';
    h+=`<div class="row ${kind==='food'?pr:'noD'}${kind==='food'?'':' noD'}">`;
    if(kind==='food')h+=`<button class="dotb d" data-act="pri" data-path="${p}" aria-label="Importância: ${PRI[pr]}. Toque para mudar"><span class="dot ${pr}"></span></button>`;
    h+=`<input class="in t" type="text" data-bind="${p}.${k}" data-row="${kind}"${o.sug?` data-sug="${kind==='food'?'food':'shop'}"`:''} value="${esc(it[k])}" placeholder="${esc(o.ph||'Alimento')}" autocomplete="off" enterkeyhint="next">`;
    h+=`<input class="in q" type="text" data-bind="${p}.q" data-row="${kind}"${o.sug?` data-sug="${kind==='food'?'qty':'shopq'}"`:''} value="${esc(it.q)}" placeholder="${esc(o.qph||'Quantidade')}" autocomplete="off" enterkeyhint="next">`;
    h+=`<button class="x" data-act="delrow" data-path="${path}" data-i="${i}" aria-label="Remover">×</button></div>`;
  });
  return h;
}
const legend=()=>'<div class="legend"><span><i class="dot"></i>Normal</span><span><i class="dot u"></i>Não pode faltar</span><span><i class="dot a"></i>Atenção</span><span><i class="dot l"></i>Livre</span></div>';

function tDieta(){
  const dk=DIAS[S.day][0],nOri=S.W.orientacoes.filter(i=>String(i.t||'').trim()).length;
  let h=`<div class="card slim"><button class="rec" data-act="oritoggle"><b>Recados para a paciente</b><small>${nOri?nOri+(nOri>1?' recados':' recado'):'nenhum'}</small><span class="muted">${S.oriOpen?'▴':'▾'}</span></button>`;
  if(S.oriOpen)h+=rowsEd('orientacoes',S.W.orientacoes,'food',{ph:'Recado',qph:'Detalhe (opcional)'})+'<div class="mact"><button class="lnk" data-act="addrow" data-path="orientacoes" data-kind="food">+ recado</button></div>';
  h+='</div><div class="days">';
  DIAS.forEach((d,i)=>{
    const has=S.W.refeicoes.some(m=>(m.dias[d[0]]||[]).some(o=>o.some(it=>String(it.t||'').trim())));
    h+=`<button class="day${i===S.day?' on':''}${has?' has':''}" data-act="day" data-i="${i}">${d[2]}</button>`;
  });
  h+='</div>'+legend();
  h+=`<div class="dayhead"><h2>${DIAS[S.day][1]}${S.day<5?'-feira':''}</h2><button class="lnk" data-act="copyday">Copiar para outros dias</button></div>`;
  S.W.refeicoes.forEach((m,mi)=>{
    const base='refeicoes.'+mi,opts=m.dias[dk]||[];
    h+=`<div class="meal imp-${m.p||'n'}"><div class="mh"><input class="in n" type="text" data-bind="${base}.nome" value="${esc(m.nome)}" placeholder="Nome da refeição" aria-label="Nome da refeição"><button class="ib" data-act="mmenu" data-i="${mi}" aria-label="Opções da refeição">⋯</button></div>`;
    h+=`<div class="impr"><input class="in t" type="time" data-bind="${base}.hora" data-time="1" value="${esc(m.hora)}" aria-label="Horário"><span class="dot ${m.p||''}"></span><select class="sel" data-bind="${base}.p" aria-label="Importância da refeição">${PO.map(v=>`<option value="${v}"${(m.p||'')===v?' selected':''}>${PRI[v]}</option>`).join('')}</select></div>`;
    if(!m.hora&&m.rotulo)h+=`<p class="muted" style="font-size:13px;margin:0 0 4px">${esc(m.rotulo)}</p>`;
    if(!opts.length)h+='<p class="muted" style="font-size:14px;padding:4px 0 2px">Nada marcado neste dia.</p>';
    opts.forEach((o,oi)=>{
      if(oi>0)h+='<div class="or">OU</div>';
      h+='<div class="opt">';
      if(opts.length>1)h+=`<div class="optlab"><span>Opção ${oi+1}</span><button class="lnk danger" data-act="delopt" data-path="${base}.dias.${dk}" data-i="${oi}">Remover opção</button></div>`;
      h+=rowsEd(`${base}.dias.${dk}.${oi}`,o,'food',{sug:true})+`<button class="lnk add" data-act="addrow" data-path="${base}.dias.${dk}.${oi}" data-kind="food">+ alimento</button></div>`;
    });
    h+=`<div class="mact"><button class="lnk" data-act="addopt" data-path="${base}.dias.${dk}">${opts.length?'+ outra opção':'+ adicionar alimentos'}</button></div></div>`;
  });
  return h+'<button class="btn big" style="margin-top:16px" data-act="addmeal">+ Nova refeição</button>';
}

function tRec(){
  let h='<p class="muted" style="margin:14px 0 4px">Receitas aparecem no arquivo da paciente.</p>';
  S.W.receitas.forEach((r,i)=>{
    const open=S.rOpen===i,b='receitas.'+i;
    h+=`<div class="card"><button class="rec" data-act="ropen" data-i="${i}"><b>${esc(r.nome||'Receita sem nome')}</b><small>${esc(r.cat||'')}</small><span class="muted">${open?'▴':'▾'}</span></button>`;
    if(open)h+=`<label class="f">Nome</label><input class="in" type="text" data-bind="${b}.nome" value="${esc(r.nome)}">
      <label class="f">Categoria (ex.: Sucos, Bolos)</label><input class="in" type="text" data-bind="${b}.cat" value="${esc(r.cat)}">
      <label class="f">Ingredientes (um por linha)</label><textarea class="in" data-lines="${b}.ing">${esc((r.ing||[]).join('\n'))}</textarea>
      <label class="f">Modo de preparo (um passo por linha)</label><textarea class="in" data-lines="${b}.prep">${esc((r.prep||[]).join('\n'))}</textarea>
      <label class="f">Observação (opcional)</label><input class="in" type="text" data-bind="${b}.obs" value="${esc(r.obs)}">
      <div class="mact"><button class="lnk" data-act="duprec" data-i="${i}">Duplicar receita</button><button class="lnk danger" data-act="delrec" data-i="${i}">Excluir</button></div>`;
    h+='</div>';
  });
  return h+'<div class="two"><button class="btn" data-act="addrec">+ Nova receita</button><button class="btn" data-act="biblio">Receitas da Tissi</button></div>';
}

function tComp(){
  let h='<p class="muted" style="margin:14px 0 0">Lista de compras por seção (açougue, frutas…).</p>';
  S.W.compras.forEach((c,ci)=>{
    const b='compras.'+ci;
    h+=`<div class="card sec"><div class="sechead"><input class="in" type="text" data-bind="${b}.cat" value="${esc(c.cat)}" placeholder="Nome da seção" aria-label="Seção"><button class="x secx" data-act="delsec" data-i="${ci}" aria-label="Excluir seção">×</button></div>
      ${rowsEd(b+'.itens',c.itens,'shop',{ph:'Item',sug:true})}
      <div class="mact"><button class="lnk" data-act="addrow" data-path="${b}.itens" data-kind="shop">+ item</button><button class="lnk" data-act="paste" data-ci="${ci}">Colar uma lista</button></div></div>`;
  });
  h+='<div class="two"><button class="btn" data-act="addsec">+ Nova seção</button><button class="btn" data-act="fromdiet">Criar do cardápio</button></div>';
  return h;
}

/* ---------- exames ---------- */
const EXS={alto:['Alto','u'],baixo:['Baixo','a'],ok:['Normal','l'],'':['Sem referência','']};
function tExa(){
  const W=S.W,rows=W.exames.map(r=>Object.assign({},r,{st:window.EXAMES.status(r)}));
  const bad=rows.filter(r=>r.st==='alto'||r.st==='baixo'),good=rows.filter(r=>r.st==='ok'),rest=rows.filter(r=>!r.st);
  let h=`<div class="card up"><b>Enviar exames ou dados da paciente</b><p class="muted" style="margin:4px 0 12px">PDF, foto, Word, Excel ou CSV. O app lê e monta o resumo abaixo.</p>
    <label class="btn primary big filebtn">Escolher arquivos<input type="file" id="exfile" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.csv,.txt,image/*" hidden></label>`;
  if(S.exRead.length)h+='<div class="exlog">'+S.exRead.map(x=>`<div class="exl ${x.st}"><span>${esc(x.name)}</span><small>${esc(x.msg)}</small></div>`).join('')+'</div>';
  h+='</div>';
  if(!rows.length){h+='<p class="muted" style="margin:16px 4px">Nenhum exame ainda. Envie um arquivo ou adicione manualmente.</p>'}
  else{
    h+=`<div class="sumhead"><h2>Resumo</h2><span class="muted">${bad.length?bad.length+' fora da referência · ':''}${good.length} normais${rest.length?' · '+rest.length+' sem referência':''}</span></div>`;
    if(S.exRead.some(x=>x.ocr))h+='<p class="warn">Lido de imagem: confira os valores com o laudo.</p>';
    const row=r=>`<button class="exr ${EXS[r.st][1]}" data-act="exedit" data-id="${esc(r.id)}"><span class="exn"><b>${esc(r.nome)}</b><small>${esc([r.pessoa,fmtFull(r.data)].filter(Boolean).join(' · '))}</small></span><span class="exv">${esc(r.v)} <small>${esc(r.u||'')}</small></span><span class="exref">${esc(r.rt||'')}</span><span class="chip ${EXS[r.st][1]}">${r.st==='alto'?'↑ ':r.st==='baixo'?'↓ ':''}${EXS[r.st][0]}</span></button>`;
    if(bad.length)h+='<div class="exgrp"><h3>Fora da referência</h3>'+bad.map(row).join('')+'</div>';
    if(good.length)h+='<div class="exgrp"><h3>Dentro da referência</h3>'+good.map(row).join('')+'</div>';
    if(rest.length)h+='<div class="exgrp"><h3>Sem referência</h3>'+rest.map(row).join('')+'</div>';
  }
  h+='<div class="two"><button class="btn" data-act="exadd">+ Adicionar exame</button>'+(rows.length?'<button class="btn" data-act="excopy">Copiar resumo</button>':'<span></span>')+'</div>';
  h+=`<label class="f">Anotações da Tissi sobre os exames</label><textarea class="in" data-bind="examesNota" placeholder="Interpretação, condutas, o que pedir no próximo exame…">${esc(W.examesNota)}</textarea>`;
  return h;
}
function examSummary(){
  const rows=S.W.exames.map(r=>Object.assign({},r,{st:window.EXAMES.status(r)}));
  const f=r=>`${r.nome} ${r.v}${r.u?' '+r.u:''}`;
  const alto=rows.filter(r=>r.st==='alto').map(f),baixo=rows.filter(r=>r.st==='baixo').map(f),ok=rows.filter(r=>r.st==='ok').length;
  const datas=rows.map(r=>r.data).filter(Boolean).sort(),d=datas.length?fmtFull(datas[datas.length-1]):'';
  const parts=[`Resumo dos exames${S.W.paciente?' de '+S.W.paciente:''}${d?' ('+d+')':''}.`];
  if(alto.length)parts.push('Acima da referência: '+alto.join('; ')+'.');
  if(baixo.length)parts.push('Abaixo da referência: '+baixo.join('; ')+'.');
  parts.push(ok+(ok===1?' exame dentro da referência.':' exames dentro da referência.'));
  return parts.join('\n');
}

function tFicha(){
  const W=S.W,F=W.ficha,b='ficha.';
  const imc=(F.peso&&F.altura)?(()=>{const p=parseFloat(String(F.peso).replace(',','.')),a=parseFloat(String(F.altura).replace(',','.'));const m=a>3?a/100:a;return p&&m?(p/(m*m)).toFixed(1).replace('.',','):''})():'';
  let h=`<label class="f">Nome</label><input class="in" type="text" data-bind="paciente" value="${esc(W.paciente)}">
  <label class="f">Tipo</label><select class="in" data-bind="tipo"><option value="individual"${W.tipo!=='familia'?' selected':''}>Individual</option><option value="familia"${W.tipo==='familia'?' selected':''}>Família ou casal</option></select>`;
  if(W.tipo==='familia')h+=`<label class="f">Pessoas (nome e observação)</label><div class="card slim">${rowsEd('membros',W.membros,'shop',{ph:'Nome',qph:'Observação (ex.: sem lactose)'})}<div class="mact"><button class="lnk" data-act="addrow" data-path="membros" data-kind="shop">+ pessoa</button></div></div>`;
  h+=`<div class="two3"><div><label class="f">Nascimento</label><input class="in" type="date" data-bind="${b}nascimento" value="${esc(F.nascimento)}"></div>
    <div><label class="f">Sexo</label><select class="in" data-bind="${b}sexo"><option value="">—</option><option value="f"${F.sexo==='f'?' selected':''}>Feminino</option><option value="m"${F.sexo==='m'?' selected':''}>Masculino</option></select></div></div>
  <div class="two3"><div><label class="f">Peso (kg)</label><input class="in" type="text" inputmode="decimal" data-bind="${b}peso" value="${esc(F.peso)}"></div>
    <div><label class="f">Altura (cm)</label><input class="in" type="text" inputmode="numeric" data-bind="${b}altura" value="${esc(F.altura)}"></div></div>
  ${imc?`<p class="muted" style="margin-top:6px">IMC ${imc}</p>`:''}
  <label class="f">Objetivo</label><input class="in" type="text" data-bind="${b}objetivo" value="${esc(F.objetivo)}">
  <label class="f">Alergias e restrições</label><input class="in" type="text" data-bind="${b}restricoes" value="${esc(F.restricoes)}">
  <label class="f">Observações</label><textarea class="in" data-bind="${b}obs">${esc(F.obs)}</textarea>
  <label class="f">Título do plano</label><input class="in" type="text" data-bind="titulo" value="${esc(W.titulo)}">
  <div class="two3"><div><label class="f">Início</label><input class="in" type="date" data-bind="inicio" value="${esc(W.inicio)}"></div><div></div></div>
  <label class="f">Nutricionista</label><input class="in" type="text" data-bind="nutri" value="${esc(W.nutri)}">
  <label class="f">Registro</label><input class="in" type="text" data-bind="registro" value="${esc(W.registro)}">
  <div class="stack" style="margin-top:26px"><button class="btn" data-act="copyfrom">Copiar de outra paciente</button><button class="btn" data-act="dup">Duplicar esta paciente</button><button class="btn danger" data-act="delpat">Excluir paciente</button></div>`;
  return h;
}

/* ---------- modais ---------- */
function vModal(){
  const m=S.modal;let h='<div class="scrim" data-act="closemodal"><div class="sheet" role="dialog" aria-modal="true">';
  const two=(ok,label,extra)=>`<div class="two"><button class="btn" data-act="closemodal">Cancelar</button><button class="btn primary${extra||''}" data-act="${ok}"${m.busy?' disabled':''}>${m.busy?'Aguarde…':label}</button></div>`;
  if(m.type==='new'){
    const T=(window.TEMPLATES||[]).filter(t=>t.tipo===m.tipo);
    h+=`<h2>Nova paciente</h2><label class="f" for="mn">Nome</label><input class="in" id="mn" type="text" autocomplete="off" value="${esc(m.nome||'')}">
    <div class="seg"><button data-act="ntipo" data-t="individual" class="${m.tipo==='individual'?'on':''}">Individual</button><button data-act="ntipo" data-t="familia" class="${m.tipo==='familia'?'on':''}">Família ou casal</button></div>
    <label class="f">Como começar?</label><div class="opts">
    <button class="optr${!m.modelo?' on':''}" data-act="nmodelo" data-id=""><b>Em branco</b><small>Só os horários das refeições</small></button>`;
    T.forEach(t=>{h+=`<button class="optr${m.modelo===t.id?' on':''}" data-act="nmodelo" data-id="${esc(t.id)}"><b>${esc(t.nome)}</b><small>${esc(t.desc)}</small></button>`});
    if(S.list.length)h+=`<button class="optr${m.modelo==='copy'?' on':''}" data-act="nmodelo" data-id="copy"><b>Copiar outra paciente</b><small>Traz cardápio, receitas e compras</small></button>`;
    h+='</div>';
    if(m.modelo==='copy')h+=`<label class="f" for="mf">Copiar de</label><select class="in" id="mf">${S.list.map(p=>`<option value="${esc(p.id)}"${m.from===p.id?' selected':''}>${esc(p.nome)}</option>`).join('')}</select>`;
    if(m.err)h+=`<p class="err-t">${esc(m.err)}</p>`;
    h+=two('create','Criar');
  }else if(m.type==='pmenu'){
    h+=`<h2>${esc(m.nome)}</h2><div class="stack"><button class="btn" data-act="open" data-id="${esc(m.id)}">Abrir</button><button class="btn" data-act="prename" data-id="${esc(m.id)}">Renomear</button><button class="btn" data-act="pdup" data-id="${esc(m.id)}"${m.busy?' disabled':''}>${m.busy?'Duplicando…':'Duplicar'}</button><button class="btn danger" data-act="pdel" data-id="${esc(m.id)}">Excluir</button><button class="lnk" data-act="closemodal">Fechar</button></div>`;
  }else if(m.type==='rename'){
    h+=`<h2>Renomear</h2><input class="in" id="rn" type="text" value="${esc(m.nome)}">${two('dorename','Salvar')}`;
  }else if(m.type==='mmenu'){
    h+=`<h2>${esc(S.W.refeicoes[m.i].nome||'Refeição')}</h2><div class="stack"><button class="btn" data-act="mup" data-i="${m.i}">Subir</button><button class="btn" data-act="mdown" data-i="${m.i}">Descer</button><button class="btn" data-act="mdup" data-i="${m.i}">Duplicar refeição</button><button class="btn danger" data-act="delmeal" data-i="${m.i}">Excluir refeição</button><button class="lnk" data-act="closemodal">Fechar</button></div>`;
  }else if(m.type==='copyday'){
    h+=`<h2>Copiar ${DIAS[S.day][1]}</h2><p class="sub">Para quais dias? O que já está neles será substituído.</p>`;
    DIAS.forEach((d,i)=>{if(i!==S.day)h+=`<label class="chk"><input type="checkbox" data-copy="${d[0]}"${m.sel&&m.sel[d[0]]?' checked':''}>${d[1]}</label>`});
    h+=`<div class="two"><button class="btn" data-act="weekdays">Seg a Sex</button><button class="btn" data-act="alldays">Todos</button></div>`+two('docopy','Copiar');
  }else if(m.type==='paste'){
    h+=`<h2>Colar uma lista</h2><p class="sub">Um item por linha. Para quantidade, use dois pontos. Ex.: Tomate: 2 kg</p><textarea class="in" id="pt" style="min-height:180px"></textarea>${two('dopaste','Adicionar')}`;
  }else if(m.type==='confirm'){
    h+=`<h2>${esc(m.title)}</h2><p class="sub">${esc(m.text||'')}</p><div class="two"><button class="btn" data-act="closemodal">Cancelar</button><button class="btn danger" data-act="doconfirm"${m.busy?' disabled':''}>${m.busy?'Aguarde…':esc(m.ok||'Excluir')}</button></div>`;
  }else if(m.type==='copyfrom'){
    const L=S.list.filter(p=>p.id!==S.cur);
    h+=`<h2>Copiar de outra paciente</h2>`;
    if(!L.length)h+='<p class="sub">Não há outras pacientes.</p><button class="lnk" data-act="closemodal">Fechar</button>';
    else{
      h+=`<label class="f" for="cf">Paciente</label><select class="in" id="cf">${L.map(p=>`<option value="${esc(p.id)}">${esc(p.nome)}</option>`).join('')}</select><p class="sub" style="margin-top:12px">O que copiar?</p>
      <label class="chk"><input type="checkbox" data-cp="dieta" checked>Refeições e cardápio (substitui)</label>
      <label class="chk"><input type="checkbox" data-cp="rec" checked>Receitas (junta com as atuais)</label>
      <label class="chk"><input type="checkbox" data-cp="comp" checked>Lista de compras (substitui)</label>
      <label class="chk"><input type="checkbox" data-cp="ori" checked>Recados (substitui)</label>${two('docopyfrom','Copiar')}`;
    }
  }else if(m.type==='biblio'){
    const R=(window.BIBLIOTECA&&window.BIBLIOTECA.receitas)||[],have=new Set(S.W.receitas.map(r=>r.id));
    h+=`<h2>Receitas da Tissi</h2><p class="sub">Marque as que quer nesta paciente.</p><div class="blist">`+R.map(r=>`<label class="chk"><input type="checkbox" data-bib="${esc(r.id)}"${have.has(r.id)?' disabled':''}><span>${esc(r.nome)}<small class="muted"> ${esc(r.cat||'')}${have.has(r.id)?' · já está':''}</small></span></label>`).join('')+'</div>'+two('dobiblio','Adicionar');
  }else if(m.type==='exame'){
    const r=m.r;
    h+=`<h2>${m.novo?'Adicionar exame':'Editar exame'}</h2>
    <label class="f" for="en">Exame</label><input class="in" id="en" type="text" list="exlist" value="${esc(r.nome)}" autocomplete="off"><datalist id="exlist">${window.EXAMES.DICT.map(d=>`<option value="${esc(d.nome)}">`).join('')}</datalist>
    <div class="two3"><div><label class="f" for="ev">Valor</label><input class="in" id="ev" type="text" inputmode="decimal" value="${esc(r.v)}"></div><div><label class="f" for="eu">Unidade</label><input class="in" id="eu" type="text" value="${esc(r.u)}"></div></div>
    <div class="two3"><div><label class="f" for="elo">Referência mínima</label><input class="in" id="elo" type="text" inputmode="decimal" value="${esc(r.lo==null?'':String(r.lo).replace('.',','))}"></div><div><label class="f" for="ehi">Referência máxima</label><input class="in" id="ehi" type="text" inputmode="decimal" value="${esc(r.hi==null?'':String(r.hi).replace('.',','))}"></div></div>
    <label class="f" for="ed">Data do exame</label><input class="in" id="ed" type="date" value="${esc(r.data)}">`;
    if(S.W.tipo==='familia')h+=`<label class="f" for="ep">De quem</label><input class="in" id="ep" type="text" list="eplist" value="${esc(r.pessoa||'')}"><datalist id="eplist">${S.W.membros.filter(x=>x.n).map(x=>`<option value="${esc(x.n)}">`).join('')}</datalist>`;
    if(m.err)h+=`<p class="err-t">${esc(m.err)}</p>`;
    h+=`<div class="two">${m.novo?'<button class="btn" data-act="closemodal">Cancelar</button>':'<button class="btn danger" data-act="exdel">Excluir</button>'}<button class="btn primary" data-act="exsave">Salvar</button></div>`;
  }else if(m.type==='export'){
    const e=S.exp;
    h+=`<h2>Baixar plano</h2><p class="sub">${esc(S.W.paciente||'')}. Escolha o que entra no arquivo.</p>`;
    [['cardapio','Refeições da semana'],['receitas','Receitas'],['compras','Lista de compras'],['orientacoes','Recados']].forEach(x=>{h+=`<label class="chk"><input type="checkbox" data-exp="${x[0]}"${e[x[0]]?' checked':''}>${x[1]}</label>`});
    h+=`<div class="stack"><button class="btn primary dbtn" data-act="dl" data-f="pdf"${S.busy?' disabled':''}>${S.busy==='pdf'?'Preparando…':'PDF'}<small>Para imprimir ou mandar pelo WhatsApp</small></button>
      <button class="btn dbtn" data-act="dl" data-f="docx"${S.busy?' disabled':''}>${S.busy==='docx'?'Preparando…':'Word'}<small>Para a paciente editar</small></button>
      <button class="btn dbtn" data-act="dl" data-f="xlsx"${S.busy?' disabled':''}>${S.busy==='xlsx'?'Preparando…':'Excel'}<small>Planilha editável</small></button></div>
      <div style="margin-top:10px"><button class="lnk" data-act="closemodal">Fechar</button></div>`;
  }
  return h+'</div></div>';
}
const openModal=m=>{S.modal=m;render()};

/* ---------- ações ---------- */
function ensureArr(path){let v=getPath(path);if(!v){const a=path.split('.'),l=a.pop(),o=a.reduce((o,k)=>o[k],S.W);o[l]=[];v=o[l]}return v}
function loadList(){
  S.loading=true;S.listErr='';render();
  return DB.list().then(l=>{S.list=l}).catch(()=>{S.listErr='Não consegui carregar as pacientes. Verifique a internet e recarregue.'}).then(()=>{S.loading=false;render()});
}
function openWith(id,W){S.cur=id;S.W=W;S.tab='dieta';S.rOpen=null;S.oriOpen=false;S.save='ok';S.dirty=false;S.exRead=[];S.modal=null;render();window.scrollTo(0,0)}
function openPatient(id){
  if(S.opening)return Promise.resolve();
  S.opening=true;S.modal=null;
  return DB.get(id).then(r=>{
    const W=normalise(r.plano||blankPlan(r.nome));let bk=lsGet(bkKey(id),null);
    const restore=bk&&bk.t>new Date(r.atualizado).getTime()&&bk.W;
    openWith(id,restore?normalise(bk.W):W);
    if(restore){touch();toast('Recuperei alterações que não tinham sido salvas.')}
  }).catch(()=>toast('Não consegui abrir essa paciente.',true)).then(()=>{S.opening=false});
}
function sortList(){S.list.sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt'))}
function createPatient(){
  const m=S.modal;if(!m||m.busy)return;
  const nome=($('mn').value||'').trim();m.nome=nome;
  if(!nome){m.err='Digite o nome da paciente.';render();return}
  const from=$('mf')?$('mf').value:'';m.from=from;
  m.busy=true;m.err='';render();
  const id=m.id;let p;
  if(m.modelo==='copy'){
    p=DB.get(from).then(r=>{const W=normalise(clone(r.plano));W.exames=[];W.examesNota='';W.ficha={};W.paciente=nome;W.inicio=todayIso();return W});
  }else if(m.modelo){
    const t=(window.TEMPLATES||[]).filter(x=>x.id===m.modelo)[0];
    const W=fromTemplate(t,nome,m.tipo);W.paciente=nome;p=Promise.resolve(W);
  }else p=Promise.resolve(blankPlan(nome,m.tipo));
  p.then(W=>DB.put(id,W).then(()=>{
    if(!S.list.some(x=>x.id===id))S.list.push({id,nome,atualizado:new Date().toISOString(),tipo:W.tipo});
    sortList();openWith(id,W);
  })).catch(()=>{if(S.modal===m){m.busy=false;m.err='Não consegui salvar. Verifique a internet e tente de novo.';render()}});
}
const getPlan=id=>DB.get(id).then(r=>r.plano);
const CP={
  dieta:(W,o)=>{W.refeicoes=clone(o.refeicoes)},
  rec:(W,o)=>{const have=new Set(W.receitas.map(r=>r.id));clone(o.receitas).forEach(r=>{if(!have.has(r.id))W.receitas.push(r)})},
  comp:(W,o)=>{W.compras=clone(o.compras)},
  ori:(W,o)=>{W.orientacoes=clone(o.orientacoes)}
};

const ACT={
  logout(){flush().then(()=>S.sb.auth.signOut()).then(()=>{S.user=null;S.list=[];S.cur=null;S.W=null;render()})},
  new(){openModal({type:'new',id:newId(),tipo:'individual',modelo:'',nome:'',focus:'#mn'})},
  ntipo(d){const m=S.modal;m.nome=$('mn').value;m.tipo=d.t;m.modelo='';m.focus=null;render();},
  nmodelo(d){const m=S.modal;m.nome=$('mn').value;m.focus=null;if($('mf'))m.from=$('mf').value;m.modelo=d.id;if(d.id==='copy'&&!m.from&&S.list[0])m.from=S.list[0].id;render()},
  create:createPatient,
  open(d){openPatient(d.id)},
  pmenu(d){const p=S.list.filter(x=>x.id===d.id)[0];openModal({type:'pmenu',id:d.id,nome:p?p.nome:''})},
  prename(d){const p=S.list.filter(x=>x.id===d.id)[0];openModal({type:'rename',id:d.id,nome:p?p.nome:'',focus:'#rn'})},
  dorename(){
    const m=S.modal;if(m.busy)return;const nome=($('rn').value||'').trim();if(!nome)return;
    m.busy=true;render();
    getPlan(m.id).then(W=>{W.paciente=nome;return DB.put(m.id,W)}).then(()=>{const p=S.list.filter(x=>x.id===m.id)[0];if(p)p.nome=nome;sortList();S.modal=null;render();toast('Renomeada.')}).catch(()=>{m.busy=false;render();toast('Não consegui renomear.',true)});
  },
  pdup(d){
    const m=S.modal;if(m.busy)return;m.busy=true;render();
    getPlan(d.id).then(W=>{W=normalise(W);W.paciente=(W.paciente||'Paciente')+' (cópia)';W.exames=[];const id=newId();return DB.put(id,W).then(()=>{S.list.push({id,nome:W.paciente,atualizado:new Date().toISOString(),tipo:W.tipo});sortList()})}).then(()=>{S.modal=null;render();toast('Duplicada.')}).catch(()=>{m.busy=false;render();toast('Não consegui duplicar.',true)});
  },
  pdel(d){const p=S.list.filter(x=>x.id===d.id)[0];openModal({type:'confirm',title:'Excluir '+(p?p.nome:'paciente')+'?',text:'O plano inteiro será apagado e não dá para desfazer.',what:'plist',id:d.id})},
  back(){flush().then(()=>{if(S.dirty){toast('Ainda não salvou. Aguarde um instante.',true);return}S.cur=null;S.W=null;S.modal=null;render();loadList()})},
  tab(d){S.tab=d.t;render()},
  day(d){S.day=+d.i;render()},
  oritoggle(){S.oriOpen=!S.oriOpen;render()},
  pri(d){const it=getPath(d.path);it.p=PO[(PO.indexOf(it.p||'')+1)%4];touch();render()},
  addrow(d){const a=ensureArr(d.path);a.push(newItem(d.kind));touch();render(d.path+'.'+(a.length-1)+'.'+(d.kind==='food'?'t':'n'))},
  delrow(d){
    const a=getPath(d.path);a.splice(+d.i,1);
    if(/\.dias\.[a-z]+\.\d+$/.test(d.path)&&!a.length){const p=d.path.split('.'),oi=+p.pop();getPath(p.join('.')).splice(oi,1)}
    touch();render();
  },
  addopt(d){const a=ensureArr(d.path);a.push([newItem('food')]);touch();render(d.path+'.'+(a.length-1)+'.0.t')},
  delopt(d){getPath(d.path).splice(+d.i,1);touch();render()},
  addmeal(){S.W.refeicoes.push(blankMeal('','',''));touch();render('refeicoes.'+(S.W.refeicoes.length-1)+'.nome')},
  mmenu(d){openModal({type:'mmenu',i:+d.i})},
  mup(d){const i=+d.i,a=S.W.refeicoes;if(i>0){[a[i],a[i-1]]=[a[i-1],a[i]];touch()}S.modal=null;render()},
  mdown(d){const i=+d.i,a=S.W.refeicoes;if(i<a.length-1){[a[i],a[i+1]]=[a[i+1],a[i]];touch()}S.modal=null;render()},
  mdup(d){const i=+d.i,c=clone(S.W.refeicoes[i]);c.id=uid('m');S.W.refeicoes.splice(i+1,0,c);touch();S.modal=null;render()},
  delmeal(d){const m=S.W.refeicoes[+d.i];openModal({type:'confirm',title:'Excluir "'+(m.nome||'refeição')+'"?',text:'Isso apaga a refeição de todos os dias.',what:'meal',i:+d.i})},
  copyday(){openModal({type:'copyday',sel:{}})},
  weekdays(){document.querySelectorAll('[data-copy]').forEach(c=>{c.checked=['seg','ter','qua','qui','sex'].indexOf(c.dataset.copy)>=0&&c.dataset.copy!==DIAS[S.day][0]})},
  alldays(){document.querySelectorAll('[data-copy]').forEach(c=>{c.checked=true})},
  docopy(){
    const src=DIAS[S.day][0];let n=0;
    document.querySelectorAll('[data-copy]').forEach(c=>{
      if(!c.checked)return;n++;
      S.W.refeicoes.forEach(m=>{const o=m.dias[src];if(o&&o.length)m.dias[c.dataset.copy]=clone(o);else delete m.dias[c.dataset.copy]});
    });
    if(!n){toast('Escolha pelo menos um dia.',true);return}
    touch();S.modal=null;render();toast('Copiado.');
  },
  addrec(){S.W.receitas.push({id:uid('r'),nome:'',cat:'',ing:[],prep:[],obs:''});S.rOpen=S.W.receitas.length-1;touch();render('receitas.'+S.rOpen+'.nome')},
  duprec(d){const i=+d.i,c=clone(S.W.receitas[i]);c.id=uid('r');c.nome=(c.nome||'Receita')+' (cópia)';S.W.receitas.splice(i+1,0,c);S.rOpen=i+1;touch();render()},
  ropen(d){S.rOpen=S.rOpen===+d.i?null:+d.i;render()},
  delrec(d){const r=S.W.receitas[+d.i];openModal({type:'confirm',title:'Excluir "'+(r.nome||'receita')+'"?',what:'rec',i:+d.i})},
  biblio(){openModal({type:'biblio'})},
  dobiblio(){
    const R=window.BIBLIOTECA.receitas;let n=0;
    document.querySelectorAll('[data-bib]:checked').forEach(c=>{const r=R.filter(x=>x.id===c.dataset.bib)[0];if(r&&!S.W.receitas.some(x=>x.id===r.id)){S.W.receitas.push(clone(r));n++}});
    if(n){touch();S.tab='rec';}
    S.modal=null;render();if(n)toast(n+(n>1?' receitas adicionadas.':' receita adicionada.'));
  },
  addsec(){S.W.compras.push({cat:'',nota:'',itens:[newItem('shop')]});touch();render('compras.'+(S.W.compras.length-1)+'.cat')},
  delsec(d){const c=S.W.compras[+d.i];openModal({type:'confirm',title:'Excluir a seção "'+(c.cat||'sem nome')+'"?',what:'sec',i:+d.i})},
  paste(d){openModal({type:'paste',ci:+d.ci,focus:'#pt'})},
  dopaste(){
    const c=S.W.compras[S.modal.ci],t=$('pt').value.split('\n');let n=0;
    c.itens=c.itens.filter(i=>String(i.n||'').trim()||String(i.q||'').trim());
    t.forEach(l=>{l=l.trim();if(!l)return;const k=l.indexOf(':'),nm=k>0?l.slice(0,k).trim():l,q=k>0?l.slice(k+1).trim():'';c.itens.push({n:nm,q});n++});
    touch();S.modal=null;render();toast(n+' itens adicionados.');
  },
  fromdiet(){
    const seen=new Set(),itens=[];
    S.W.refeicoes.forEach(m=>Object.keys(m.dias).forEach(k=>(m.dias[k]||[]).forEach(o=>o.forEach(it=>{const t=String(it.t||'').trim(),nn=nrm(t);if(t&&!seen.has(nn)&&!/livre/.test(nn)){seen.add(nn);itens.push({n:t,q:''})}}))));
    if(!itens.length){toast('Preencha o cardápio primeiro.',true);return}
    S.W.compras.push({cat:'Do cardápio',nota:'',itens});touch();render();toast(itens.length+' itens. Preencha as quantidades.');
  },
  doconfirm(){
    const m=S.modal;if(m.busy)return;
    if(m.what==='meal')S.W.refeicoes.splice(m.i,1);
    else if(m.what==='rec'){S.W.receitas.splice(m.i,1);S.rOpen=null}
    else if(m.what==='sec')S.W.compras.splice(m.i,1);
    else if(m.what==='plist'||m.what==='pat'){
      const id=m.what==='pat'?S.cur:m.id;m.busy=true;render();
      if(m.what==='pat'){S.dirty=false;clearTimeout(timer)}
      DB.del(id).then(()=>{S.list=S.list.filter(p=>p.id!==id);try{localStorage.removeItem(bkKey(id))}catch(e){}if(S.cur===id){S.cur=null;S.W=null}S.modal=null;render();toast('Excluída.')}).catch(()=>{m.busy=false;render();toast('Não consegui excluir.',true)});
      return;
    }
    touch();S.modal=null;render();
  },
  export(){openModal({type:'export'})},
  copyfrom(){openModal({type:'copyfrom'})},
  docopyfrom(){
    const m=S.modal;if(m.busy)return;const id=$('cf').value;
    const parts=[...document.querySelectorAll('[data-cp]:checked')].map(c=>c.dataset.cp);
    if(!parts.length){toast('Marque o que copiar.',true);return}
    m.busy=true;render();
    getPlan(id).then(o=>{o=normalise(o);parts.forEach(p=>CP[p](S.W,o));touch();S.modal=null;render();toast('Copiado.')}).catch(()=>{m.busy=false;render();toast('Não consegui copiar.',true)});
  },
  dup(){
    flush().then(()=>{
      const W=clone(S.W);W.paciente=(W.paciente||'Paciente')+' (cópia)';W.exames=[];W.examesNota='';const id=newId();
      return DB.put(id,W).then(()=>{S.list.push({id,nome:W.paciente,atualizado:new Date().toISOString(),tipo:W.tipo});sortList();openWith(id,W);S.tab='ficha';render();toast('Cópia criada. Ajuste o nome.')});
    }).catch(()=>toast('Não consegui duplicar.',true));
  },
  delpat(){openModal({type:'confirm',title:'Excluir '+(S.W.paciente||'esta paciente')+'?',text:'O plano inteiro será apagado e não dá para desfazer.',what:'pat'})},
  /* exames */
  exadd(){openModal({type:'exame',novo:true,r:{id:uid('e'),nome:'',v:'',u:'',lo:null,hi:null,data:todayIso(),pessoa:''},focus:'#en'})},
  exedit(d){const r=S.W.exames.filter(x=>x.id===d.id)[0];if(r)openModal({type:'exame',novo:false,r:Object.assign({},r)})},
  exsave(){
    const m=S.modal,r=m.r,nome=($('en').value||'').trim(),v=($('ev').value||'').trim();
    if(!nome||!v){m.err='Preencha o exame e o valor.';m.r.nome=nome;m.r.v=v;render();return}
    const num=s=>{s=String(s||'').trim().replace(',','.');return s===''||isNaN(parseFloat(s))?null:parseFloat(s)};
    r.nome=nome;r.v=v;r.u=($('eu').value||'').trim();r.lo=num($('elo').value);r.hi=num($('ehi').value);r.data=$('ed').value||'';
    if($('ep'))r.pessoa=($('ep').value||'').trim();
    r.rt=window.EXAMES.refText(r.lo,r.hi);
    const i=S.W.exames.findIndex(x=>x.id===r.id);
    if(i>=0)S.W.exames[i]=Object.assign(S.W.exames[i],r);else S.W.exames.push(r);
    touch();S.modal=null;render();
  },
  exdel(){const i=S.W.exames.findIndex(x=>x.id===S.modal.r.id);if(i>=0)S.W.exames.splice(i,1);touch();S.modal=null;render()},
  excopy(){
    const t=examSummary();
    (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('Resumo copiado.')).catch(()=>{const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('Resumo copiado.')}catch(e){toast('Não consegui copiar.',true)}ta.remove()});
  },
  closemodal(d,b,e){if(e&&e.target!==b)return;S.modal=null;render()},
  dl(d){doExport(d.f)}
};
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act;
  if(a==='closemodal'&&b.classList.contains('scrim')&&e.target!==b)return;
  if(ACT[a])ACT[a](b.dataset,b,e);
});

/* campos */
document.addEventListener('input',e=>{
  const el=e.target;
  if(el.id==='q'){S.q=el.value;const pos=el.selectionStart;render();const q=$('q');if(q){q.focus();try{q.setSelectionRange(pos,pos)}catch(x){}}return}
  if(!S.W||!S.cur)return;
  if(el.dataset.lines){setPath(el.dataset.lines,el.value.split('\n').map(s=>s.trim()).filter(Boolean));touch();return}
  if(el.dataset.bind!==undefined&&el.tagName!=='SELECT'){
    setPath(el.dataset.bind,el.value);
    if(el.dataset.time){const mi=el.dataset.bind.split('.')[1];if(el.value)S.W.refeicoes[mi].rotulo=''}
    touch();
    if(el.dataset.bind==='paciente'){const h=document.querySelector('.top h1');if(h)h.textContent=el.value||'Nova paciente'}
    if(el.dataset.sug)showSug(el);
  }
});
document.addEventListener('focusin',e=>{const el=e.target;if(el.dataset&&el.dataset.sug&&S.W)showSug(el)});
document.addEventListener('focusout',e=>{
  const el=e.target;
  if(el.dataset&&el.dataset.sug){
    setTimeout(()=>{if(SUG&&document.activeElement!==SUG.el)hideSug()},150);
    const p=el.dataset.bind.split('.'),f=p.pop();
    if(S.W){const base=p.join('.');
      if(f==='t'||f==='n')learn(getPath(base+'.'+f),getPath(base+'.q'));
      else learn(getPath(base+'.t')||getPath(base+'.n'),getPath(base+'.q'));
    }
  }
});
document.addEventListener('change',e=>{
  const el=e.target;
  if(el.id==='exfile'){readExams([...el.files]);el.value='';return}
  if(el.dataset.exp){S.exp[el.dataset.exp]=el.checked;return}
  if(el.dataset.copy){S.modal.sel[el.dataset.copy]=el.checked;return}
  if(el.id==='en'&&S.modal&&S.modal.type==='exame'){
    const d=window.EXAMES.DICT.filter(x=>x.nome===el.value)[0];
    if(d){const sx=S.W.ficha.sexo,rf=d.ref?(Array.isArray(d.ref)?d.ref:d.ref[sx==='m'?'m':'f']):null;
      if(!$('eu').value)$('eu').value=d.un;
      if(rf&&!$('elo').value&&!$('ehi').value){$('elo').value=rf[0]==null?'':String(rf[0]).replace('.',',');$('ehi').value=rf[1]==null?'':String(rf[1]).replace('.',',')}}
    return;
  }
  if(el.tagName==='SELECT'&&el.dataset.bind!==undefined&&S.W){
    setPath(el.dataset.bind,el.value);
    if(el.dataset.bind==='tipo'&&el.value==='familia'&&!S.W.membros.length)S.W.membros=[{n:'',q:''}];
    touch();render();
  }
});
document.addEventListener('keydown',e=>{
  const el=e.target;
  if(SUG&&el===SUG.el){
    if(e.key==='ArrowDown'){e.preventDefault();SUG.i=Math.min(SUG.items.length-1,SUG.i+1);paintSug();return}
    if(e.key==='ArrowUp'){e.preventDefault();SUG.i=Math.max(-1,SUG.i-1);paintSug();return}
    if(e.key==='Enter'&&SUG.i>=0){e.preventDefault();applySug(SUG.i);return}
    if(e.key==='Escape'){hideSug();return}
  }
  if(e.key==='Escape'&&S.modal){S.modal=null;render();return}
  if(e.key==='Enter'&&el.id==='mn'){e.preventDefault();createPatient();return}
  if(e.key==='Enter'&&el.id==='rn'){e.preventDefault();ACT.dorename();return}
  if(e.key==='Enter'&&el.dataset&&el.dataset.row){
    e.preventDefault();hideSug();
    const p=el.dataset.bind.split('.'),f=p.pop(),i=+p.pop(),arrPath=p.join('.'),kind=el.dataset.row;
    if(f==='t'||f==='n'){const q=document.querySelector('[data-bind="'+arrPath+'.'+i+'.q"]');if(q)q.focus();return}
    advance(arrPath,i,kind);
  }
});
document.addEventListener('submit',e=>{
  if(e.target.dataset.form!=='login')return;
  e.preventDefault();
  S.loading=true;S.loginErr='';const em=$('em').value.trim(),pw=$('pw').value;S.loginEm=em;render();
  S.sb.auth.signInWithPassword({email:em,password:pw}).then(r=>{
    if(r.error)throw r.error;
    S.user=r.data.user;S.loading=false;return loadList();
  }).catch(err=>{
    S.loading=false;
    const m=(err&&err.message)||'',st=err&&err.status;
    if(/invalid login|invalid credentials/i.test(m))S.loginErr='E-mail ou senha incorretos.';
    else if(/not confirmed/i.test(m))S.loginErr='Este e-mail ainda não foi confirmado no Supabase (marque Auto Confirm User ao criar o usuário).';
    else if(/api key|apikey|jwt/i.test(m)||st===401||st===403)S.loginErr='A chave do Supabase no config.js está errada ('+m+').';
    else if(/fetch|network|load failed/i.test(m))S.loginErr='Não encontrei o Supabase. Confira a URL no config.js ('+m+').';
    else S.loginErr='Não consegui entrar: '+(m||'erro desconhecido');
    render();
  });
});

/* ---------- ler exames ---------- */
function readExams(files){
  if(!files.length||S.exBusy)return;
  S.exBusy=true;S.exRead=files.map(f=>({name:f.name,st:'wait',msg:'Na fila'}));render();
  const W=S.W,sexo=W.ficha.sexo||'';
  let p=Promise.resolve();
  files.forEach((f,i)=>{
    p=p.then(()=>{
      const x=S.exRead[i];x.st='run';x.msg='Lendo…';repaintEx();
      return window.EXAMES.readFile(f,S.W.ficha.sexo||sexo,pr=>{x.msg='Lendo imagem… '+Math.round(pr*100)+'%';repaintEx()}).then(r=>{
        let add=0;
        r.rows.forEach(row=>{
          row.id=uid('e');row.arq=f.name;if(S.W.tipo==='familia')row.pessoa='';
          const j=S.W.exames.findIndex(e=>e.k===row.k&&e.data===row.data&&!e.pessoa);
          if(j>=0)S.W.exames[j]=Object.assign(row,{id:S.W.exames[j].id});else S.W.exames.push(row);add++;
        });
        const F=S.W.ficha,filled=[];
        ['sexo','nascimento','peso','altura'].forEach(k=>{if(r.ficha[k]&&!F[k]){F[k]=r.ficha[k];filled.push(k)}});
        x.ocr=r.ocr;x.st=add||filled.length?'ok':'warn';
        x.msg=add?add+(add>1?' valores encontrados':' valor encontrado')+(filled.length?' · ficha atualizada':''):(filled.length?'Ficha atualizada':'Não encontrei exames conhecidos neste arquivo');
        if(r.ocr&&!add)x.msg+=' (lido de imagem)';
        touch();
      }).catch(err=>{
        const m=String(err&&err.message||'');
        x.st='err';x.msg=/^formato:(xls|doc)$/.test(m)?'Formato antigo. Salve como .xlsx ou .docx e envie de novo.':/^formato:/.test(m)?'Formato não suportado':/lib/.test(m)?'Sem internet para carregar o leitor. Tente de novo.':'Não consegui ler este arquivo';
      }).then(repaintEx);
    });
  });
  p.then(()=>{S.exBusy=false;render()});
}
function repaintEx(){if(S.tab==='exa')render()}

/* ---------- exportar ---------- */
const fileBase=()=>'Plano alimentar - '+String(S.W.paciente||'paciente').replace(/[\\\/:*?"<>|]/g,'').trim();
function loadLogo(){
  if(S.logo!==undefined)return Promise.resolve(S.logo);
  return fetch('logo.png').then(r=>{if(!r.ok)throw 0;return r.blob()}).then(b=>Promise.all([new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(b)}),b.arrayBuffer()])).then(r=>{
    const img=new Image();return new Promise(res=>{img.onload=()=>res({data:r[0],buf:r[1],w:img.naturalWidth,h:img.naturalHeight});img.onerror=()=>res(null);img.src=r[0]});
  }).catch(()=>null).then(l=>{S.logo=l;return l});
}
function doExport(f){
  if(S.busy)return;
  const W=clone(S.W),ex=clone(S.exp);
  if(!ex.cardapio&&!ex.receitas&&!ex.compras&&!ex.orientacoes){toast('Marque pelo menos uma parte.',true);return}
  S.busy=f;render();
  flush().then(()=>Promise.all([loadLib(f),loadLogo()])).then(r=>{ex.logo=r[1];return window.__EXP[f](W,ex)}).then(blob=>{
    const a=document.createElement('a'),url=URL.createObjectURL(blob);
    a.href=url;a.download=fileBase()+'.'+f;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
    toast('Arquivo pronto.');
  }).catch(err=>{
    toast(err&&err.message==='lib'?'Sem internet para preparar o arquivo. Tente de novo.':'Não foi possível gerar o arquivo.',true);
  }).then(()=>{S.busy=null;if(S.modal&&S.modal.type==='export')render()});
}

/* ---------- início ---------- */
render();
if(DB.cfgOk()){
  DB.init();
  S.sb.auth.getSession().then(r=>{
    const s=r.data&&r.data.session;
    if(s){S.user=s.user;return loadList()}
    render();
  }).catch(()=>render());
  S.sb.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT'&&S.user){S.user=null;S.cur=null;render()}});
}
})();
