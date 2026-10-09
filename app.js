(function(){
"use strict";
var DIAS=[['seg','Segunda','Seg'],['ter','Terça','Ter'],['qua','Quarta','Qua'],['qui','Quinta','Qui'],['sex','Sexta','Sex'],['sab','Sábado','Sáb'],['dom','Domingo','Dom']];
var PO=['','u','a','l'];
var PRI={'':'Normal',u:'Não pode faltar',a:'Atenção',l:'Livre'};
var LIBS={
  pdf:{url:'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',ok:function(){return window.jspdf&&window.jspdf.jsPDF}},
  docx:{url:'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js',ok:function(){return window.docx&&window.docx.Document}},
  xlsx:{url:'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js',ok:function(){return window.ExcelJS&&window.ExcelJS.Workbook}}
};
var loading={};
function loadLib(k){
  var L=LIBS[k];if(L.ok())return Promise.resolve();
  if(loading[k])return loading[k];
  loading[k]=new Promise(function(res,rej){
    var s=document.createElement('script');s.src=L.url;
    s.onload=function(){if(L.ok())res();else{delete loading[k];rej(new Error('lib'))}};
    s.onerror=function(){delete loading[k];rej(new Error('lib'))};
    document.head.appendChild(s);
  });
  return loading[k];
}

var $=function(id){return document.getElementById(id)};
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function clone(o){return JSON.parse(JSON.stringify(o))}
function uid(p){return (p||'x')+Math.random().toString(36).slice(2,8)}
function fmtDate(iso){if(!iso)return '';var d=new Date(iso);return isNaN(d)?'':d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}
function todayIso(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}

/* ---------- estado ---------- */
var S={sb:null,user:null,list:[],cur:null,W:null,tab:'ref',day:(new Date().getDay()+6)%7,
  save:'ok',dirty:false,saving:false,modal:null,rOpen:null,busy:null,loginErr:'',loading:false,
  exp:{cardapio:true,receitas:true,compras:true,orientacoes:true}};

/* ---------- modelo ---------- */
function blankMeal(hora,nome,rotulo){return {id:uid('m'),hora:hora||'',rotulo:rotulo||'',nome:nome||'',p:'',todos:[],dias:{}}}
function blankPlan(nome,old){
  var cfg=lastCfg();
  return {v:2,paciente:nome||'',titulo:'Alimentação semanal',inicio:todayIso(),
    nutri:(old&&old.nutri)||cfg.nutri||'Tissiana Ramos',registro:(old&&old.registro)||cfg.registro||'Nutricionista · CRN 2669',
    orientacoes:[],
    refeicoes:[blankMeal('','Em jejum','Ao acordar'),blankMeal('07:00','Café da manhã'),blankMeal('10:00','Lanche da manhã'),blankMeal('12:00','Almoço'),blankMeal('15:30','Lanche da tarde'),blankMeal('19:00','Jantar'),blankMeal('','Ceia','Antes de dormir')],
    receitas:[],compras:[]};
}
function lastCfg(){try{return JSON.parse(localStorage.getItem('tissi:cfg')||'{}')}catch(e){return {}}}
/* garante estrutura e junta itens "todos os dias" dentro de cada dia (modelo simples) */
function normalise(W){
  W.orientacoes=W.orientacoes||[];W.receitas=W.receitas||[];W.compras=W.compras||[];W.refeicoes=W.refeicoes||[];
  W.refeicoes.forEach(function(m){
    m.dias=m.dias||{};m.rotulo=m.rotulo||'';m.hora=m.hora||'';
    var td=(m.todos||[]),dp=(m.depois||[]);
    if(td.length||dp.length){
      DIAS.forEach(function(d){
        var opts=m.dias[d[0]];
        if(opts&&opts.length)m.dias[d[0]]=opts.map(function(o){return clone(td).concat(o,clone(dp))});
        else if(!opts&&td.length)m.dias[d[0]]=[clone(td).concat(clone(dp))];
      });
    }
    m.todos=[];m.depois=[];
  });
  return W;
}

/* ---------- caminhos ---------- */
function getPath(p){return p.split('.').reduce(function(o,k){return o==null?o:o[k]},S.W)}
function setPath(p,v){var a=p.split('.'),l=a.pop(),o=a.reduce(function(o,k){return o[k]},S.W);o[l]=v}

/* ---------- banco ---------- */
var DB={
  cfgOk:function(){var c=window.TISSI_CONFIG||{};return !!(c.SUPABASE_URL&&c.SUPABASE_ANON_KEY&&window.supabase)},
  init:function(){var c=window.TISSI_CONFIG;S.sb=window.supabase.createClient(c.SUPABASE_URL,c.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}})},
  list:function(){return S.sb.from('pacientes').select('id,nome,atualizado').order('nome',{ascending:true}).then(function(r){if(r.error)throw r.error;return r.data||[]})},
  get:function(id){return S.sb.from('pacientes').select('id,nome,plano,atualizado').eq('id',id).single().then(function(r){if(r.error)throw r.error;return r.data})},
  put:function(id,W){return S.sb.from('pacientes').upsert({id:id,nome:W.paciente||'Sem nome',plano:W,atualizado:new Date().toISOString()},{onConflict:'id'}).then(function(r){if(r.error)throw r.error})},
  del:function(id){return S.sb.from('pacientes').delete().eq('id',id).then(function(r){if(r.error)throw r.error})}
};

/* ---------- salvar ---------- */
var timer=null,retry=null;
function bkKey(id){return 'tissi:bk:'+id}
function touch(){
  if(!S.cur)return;
  S.dirty=true;S.save='saving';paintSave();
  try{localStorage.setItem(bkKey(S.cur),JSON.stringify({t:Date.now(),W:S.W}))}catch(e){}
  clearTimeout(timer);timer=setTimeout(flush,700);
}
function flush(){
  clearTimeout(timer);
  if(!S.cur||!S.dirty)return Promise.resolve();
  if(S.saving){timer=setTimeout(flush,300);return Promise.resolve()}
  var id=S.cur,snap=JSON.stringify(S.W);S.saving=true;S.dirty=false;
  return DB.put(id,JSON.parse(snap)).then(function(){
    S.saving=false;
    var it=S.list.filter(function(p){return p.id===id})[0];
    if(it){it.nome=S.W.paciente||'Sem nome';it.atualizado=new Date().toISOString()}
    try{localStorage.setItem('tissi:cfg',JSON.stringify({nutri:S.W.nutri,registro:S.W.registro}))}catch(e){}
    if(!S.dirty){S.save='ok';try{localStorage.removeItem(bkKey(id))}catch(e){}}
    paintSave();
  }).catch(function(){
    S.saving=false;S.dirty=true;S.save='err';paintSave();
    clearTimeout(retry);retry=setTimeout(function(){flush()},5000);
  });
}
function paintSave(){
  var el=$('save');if(!el)return;
  el.className='save'+(S.save==='err'?' err':'');
  el.textContent=S.save==='ok'?'Salvo ✓':S.save==='saving'?'Salvando…':'Não salvou';
  var bn=$('banner');if(bn)bn.hidden=S.save!=='err';
}
window.addEventListener('beforeunload',function(e){if(S.dirty||S.saving){e.preventDefault();e.returnValue=''}});
document.addEventListener('visibilitychange',function(){if(document.hidden)flush()});
window.addEventListener('online',function(){if(S.dirty)flush()});

/* ---------- toast ---------- */
function toast(t,bad){
  var d=document.createElement('div');d.className='toast'+(bad?' bad':'');d.textContent=t;$('toasts').appendChild(d);
  setTimeout(function(){d.remove()},bad?4500:2400);
}

/* ---------- render raiz ---------- */
function render(focus){
  var h;
  if(!DB.cfgOk())h=vSetup();
  else if(!S.user)h=vLogin();
  else if(!S.cur)h=vList();
  else h=vPatient();
  var y=window.scrollY,keep=$('app').dataset.scr===(S.cur||'')+'|'+(S.user?1:0);
  $('app').dataset.scr=(S.cur||'')+'|'+(S.user?1:0);
  $('app').innerHTML=h;
  $('modal').innerHTML=S.modal?vModal():'';
  if(keep)window.scrollTo(0,y);
  paintSave();
  if(focus){var el=document.querySelector('[data-bind="'+focus+'"]');if(el){el.focus();if(el.select&&el.type==='text'&&!el.value)el.select()}}
  if(S.modal&&S.modal.focus){var m=document.querySelector(S.modal.focus);if(m)m.focus()}
}

function vSetup(){
  return '<div class="login"><h1>Falta configurar</h1><p class="muted">Abra o arquivo <b>config.js</b> e cole a URL e a chave do Supabase. O passo a passo está no README.</p></div>';
}
function vLogin(){
  return '<form class="login" data-form="login"><h1>Planos da Tissi</h1><p class="muted">Entre para montar os planos das pacientes.</p>'+
  '<label class="f" for="em">E-mail</label><input class="in" id="em" type="email" autocomplete="username" value="'+esc(S.loginEm||'')+'" required>'+
  '<label class="f" for="pw">Senha</label><input class="in" id="pw" type="password" autocomplete="current-password" required>'+
  '<div style="height:18px"></div><button class="btn primary big" type="submit"'+(S.loading?' disabled':'')+'>'+(S.loading?'Entrando…':'Entrar')+'</button>'+
  (S.loginErr?'<p class="err-t">'+esc(S.loginErr)+'</p>':'')+'</form>';
}
function vList(){
  var h='<div class="wrap"><div class="hello"><h1>Pacientes</h1><button class="lnk" data-act="logout">Sair</button></div>';
  if(S.loading&&!S.list.length)h+='<p class="muted">Carregando…</p>';
  else if(!S.list.length){
    h+='<div class="empty"><p>Nenhuma paciente ainda.</p><button class="btn primary" data-act="new">+ Nova paciente</button></div>';
  }else{
    h+='<button class="btn primary big" data-act="new" style="margin-bottom:16px">+ Nova paciente</button>';
    S.list.forEach(function(p){
      h+='<button class="pcard" data-act="open" data-id="'+esc(p.id)+'"><b>'+esc(p.nome||'Sem nome')+'</b><small>'+esc(fmtDate(p.atualizado))+'</small></button>';
    });
  }
  if(S.listErr)h+='<p class="err-t">'+esc(S.listErr)+'</p>';
  return h+'</div>';
}

/* ---------- paciente ---------- */
var TABS=[['ref','Refeições'],['rec','Receitas'],['comp','Compras'],['ori','Recados'],['dad','Dados']];
function vPatient(){
  var h='<div class="top"><div class="in"><button class="back" data-act="back">‹ Pacientes</button><h1>'+esc(S.W.paciente||'Nova paciente')+'</h1><span class="save" id="save"></span><button class="btn primary" data-act="export">Baixar</button></div><div class="banner" id="banner" hidden>Não está salvando. Verifique a internet e não feche esta página.</div></div>';
  h+='<div class="wrap"><div class="tabs">'+TABS.map(function(t){return '<button class="tab'+(S.tab===t[0]?' on':'')+'" data-act="tab" data-t="'+t[0]+'">'+t[1]+'</button>'}).join('')+'</div>';
  h+={ref:tRef,rec:tRec,comp:tComp,ori:tOri,dad:tDad}[S.tab]();
  return h+'</div>'+foodsList();
}
function foodsList(){
  var seen={},o=[];
  S.W.refeicoes.forEach(function(m){Object.keys(m.dias).forEach(function(k){(m.dias[k]||[]).forEach(function(op){op.forEach(function(it){var t=String(it.t||'').trim();if(t&&!seen[t]){seen[t]=1;o.push(t)}})})})});
  return '<datalist id="foods">'+o.map(function(t){return '<option value="'+esc(t)+'">'}).join('')+'</datalist>';
}

/* linhas (alimento+quantidade) */
function rowsEd(path,arr,kind,ph){
  var h='';
  arr.forEach(function(it,i){
    var p=path+'.'+i,pr=kind==='food'?(it.p||''):'';
    h+='<div class="row '+(kind==='food'?pr:'noD')+(kind==='food'?'':' noD')+'">';
    if(kind==='food')h+='<button class="dotb d" data-act="pri" data-path="'+p+'" aria-label="Prioridade: '+PRI[pr]+'. Toque para mudar"><span class="dot '+pr+'"></span></button>';
    var kk=kind==='food'?'t':'n';
    h+='<input class="in t" type="text" data-bind="'+p+'.'+kk+'" data-row="'+kind+'" value="'+esc(it[kk])+'" placeholder="'+esc(ph||'Alimento')+'" '+(kind==='food'?'list="foods" ':'')+'autocomplete="off">';
    h+='<input class="in q" type="text" data-bind="'+p+'.q" data-row="'+kind+'" value="'+esc(it.q)+'" placeholder="Quantidade" autocomplete="off">';
    h+='<button class="x" data-act="delrow" data-path="'+path+'" data-i="'+i+'" aria-label="Remover">×</button></div>';
  });
  return h;
}
function newItem(kind){return kind==='food'?{t:'',q:'',p:''}:{n:'',q:''}}

function legend(){
  return '<div class="legend"><span><i class="dot"></i>Normal</span><span><i class="dot u"></i>Não pode faltar</span><span><i class="dot a"></i>Atenção</span><span><i class="dot l"></i>Livre</span></div>';
}

function tRef(){
  var dk=DIAS[S.day][0],h='<div class="days">';
  DIAS.forEach(function(d,i){
    var has=S.W.refeicoes.some(function(m){return (m.dias[d[0]]||[]).some(function(o){return o.some(function(it){return String(it.t||'').trim()})})});
    h+='<button class="day'+(i===S.day?' on':'')+(has?' has':'')+'" data-act="day" data-i="'+i+'">'+d[2]+'</button>';
  });
  h+='</div>'+legend();
  h+='<div class="dayhead"><h2>'+DIAS[S.day][1]+(S.day<5?'-feira':'')+'</h2><button class="lnk" data-act="copyday">Copiar para outros dias</button></div>';
  S.W.refeicoes.forEach(function(m,mi){
    var base='refeicoes.'+mi,opts=m.dias[dk]||[];
    h+='<div class="meal"><div class="mh"><input class="in t" type="time" data-bind="'+base+'.hora" data-time="1" value="'+esc(m.hora)+'" aria-label="Horário">'+
      '<input class="in n" type="text" data-bind="'+base+'.nome" value="'+esc(m.nome)+'" placeholder="Nome da refeição" aria-label="Nome da refeição">'+
      '<button class="ib up" data-act="mup" data-i="'+mi+'" aria-label="Subir">↑</button><button class="ib dn" data-act="mdown" data-i="'+mi+'" aria-label="Descer">↓</button>'+
      '<button class="ib del" data-act="delmeal" data-i="'+mi+'" aria-label="Excluir refeição">×</button></div>';
    if(!m.hora&&m.rotulo)h+='<p class="muted" style="font-size:13px;margin:-4px 0 4px">'+esc(m.rotulo)+'</p>';
    if(!opts.length)h+='<p class="muted" style="font-size:14px;padding:4px 0 2px">Nada marcado neste dia.</p>';
    opts.forEach(function(o,oi){
      if(oi>0)h+='<div class="or">OU</div>';
      h+='<div class="opt">';
      if(opts.length>1)h+='<div class="optlab"><span>Opção '+(oi+1)+'</span><button class="lnk danger" data-act="delopt" data-path="'+base+'.dias.'+dk+'" data-i="'+oi+'">Remover opção</button></div>';
      h+=rowsEd(base+'.dias.'+dk+'.'+oi,o,'food')+
        '<button class="lnk add" data-act="addrow" data-path="'+base+'.dias.'+dk+'.'+oi+'" data-kind="food">+ alimento</button></div>';
    });
    h+='<div class="mact">'+(opts.length?'<button class="lnk" data-act="addopt" data-path="'+base+'.dias.'+dk+'">+ outra opção</button>':'<button class="lnk" data-act="addopt" data-path="'+base+'.dias.'+dk+'">+ adicionar alimentos</button>')+'</div></div>';
  });
  h+='<button class="btn big" style="margin-top:16px" data-act="addmeal">+ Nova refeição</button>';
  return h;
}

function tRec(){
  var h='<p class="muted" style="margin:14px 0 4px">Receitas aparecem no arquivo da paciente.</p>';
  S.W.receitas.forEach(function(r,i){
    var open=S.rOpen===i,b='receitas.'+i;
    h+='<div class="card"><button class="rec" data-act="ropen" data-i="'+i+'"><b>'+esc(r.nome||'Receita sem nome')+'</b><small>'+esc(r.cat||'')+'</small><span class="muted">'+(open?'▴':'▾')+'</span></button>';
    if(open){
      h+='<label class="f">Nome</label><input class="in" type="text" data-bind="'+b+'.nome" value="'+esc(r.nome)+'">'+
        '<label class="f">Categoria (ex.: Sucos, Bolos)</label><input class="in" type="text" data-bind="'+b+'.cat" value="'+esc(r.cat)+'">'+
        '<label class="f">Ingredientes (um por linha)</label><textarea class="in" data-lines="'+b+'.ing">'+esc((r.ing||[]).join('\n'))+'</textarea>'+
        '<label class="f">Modo de preparo (um passo por linha)</label><textarea class="in" data-lines="'+b+'.prep">'+esc((r.prep||[]).join('\n'))+'</textarea>'+
        '<label class="f">Observação (opcional)</label><input class="in" type="text" data-bind="'+b+'.obs" value="'+esc(r.obs)+'">'+
        '<div style="margin-top:8px"><button class="lnk danger" data-act="delrec" data-i="'+i+'">Excluir receita</button></div>';
    }
    h+='</div>';
  });
  return h+'<button class="btn big" style="margin-top:14px" data-act="addrec">+ Nova receita</button>';
}

function tComp(){
  var h='<p class="muted" style="margin:14px 0 0">Lista de compras por seção (açougue, frutas…).</p>';
  S.W.compras.forEach(function(c,ci){
    var b='compras.'+ci;
    h+='<div class="card sec"><div class="sechead"><input class="in" type="text" data-bind="'+b+'.cat" value="'+esc(c.cat)+'" placeholder="Nome da seção" aria-label="Seção"><button class="x" style="width:40px;height:44px;font-size:24px;color:var(--faint)" data-act="delsec" data-i="'+ci+'" aria-label="Excluir seção">×</button></div>'+
      rowsEd(b+'.itens',c.itens,'shop','Item')+
      '<div class="mact"><button class="lnk" data-act="addrow" data-path="'+b+'.itens" data-kind="shop">+ item</button><button class="lnk" data-act="paste" data-ci="'+ci+'">Colar uma lista</button></div></div>';
  });
  return h+'<button class="btn big" style="margin-top:14px" data-act="addsec">+ Nova seção</button>';
}

function tOri(){
  var h='<p class="muted" style="margin:14px 0 0">Avisos gerais que aparecem no começo do arquivo (ex.: “Enzimas antes das refeições”).</p>'+legend();
  h+='<div class="card">'+rowsEd('orientacoes',S.W.orientacoes,'food','Recado')+'<div class="mact"><button class="lnk" data-act="addrow" data-path="orientacoes" data-kind="food">+ recado</button></div></div>';
  return h;
}

function tDad(){
  var W=S.W;
  return '<label class="f">Nome da paciente</label><input class="in" type="text" data-bind="paciente" value="'+esc(W.paciente)+'">'+
    '<label class="f">Título</label><input class="in" type="text" data-bind="titulo" value="'+esc(W.titulo)+'">'+
    '<label class="f">Início do plano</label><input class="in" type="date" data-bind="inicio" value="'+esc(W.inicio)+'">'+
    '<label class="f">Nutricionista</label><input class="in" type="text" data-bind="nutri" value="'+esc(W.nutri)+'">'+
    '<label class="f">Registro</label><input class="in" type="text" data-bind="registro" value="'+esc(W.registro)+'">'+
    '<div class="stack" style="margin-top:26px"><button class="btn" data-act="dup">Duplicar esta paciente</button><button class="btn danger" data-act="delpat">Excluir paciente</button></div>';
}

/* ---------- modais ---------- */
function vModal(){
  var m=S.modal,h='<div class="scrim" data-act="closemodal"><div class="sheet" role="dialog" aria-modal="true">';
  if(m.type==='new'){
    h+='<h2>Nova paciente</h2><label class="f" for="mn">Nome</label><input class="in" id="mn" type="text" autocomplete="off" value="'+esc(m.nome||'')+'">'+
      '<label class="f" for="mf">Começar de</label><select class="in" id="mf"><option value="">Em branco</option>'+S.list.map(function(p){return '<option value="'+esc(p.id)+'">Cópia de '+esc(p.nome)+'</option>'}).join('')+'</select>'+
      (m.err?'<p class="err-t">'+esc(m.err)+'</p>':'')+
      '<div class="two"><button class="btn" data-act="closemodal">Cancelar</button><button class="btn primary" data-act="create">Criar</button></div>';
  }else if(m.type==='copyday'){
    h+='<h2>Copiar '+DIAS[S.day][1]+'</h2><p class="sub">Para quais dias? O que já está neles será substituído.</p>';
    DIAS.forEach(function(d,i){if(i!==S.day)h+='<label class="chk"><input type="checkbox" data-copy="'+d[0]+'"'+(m.sel&&m.sel[d[0]]?' checked':'')+'>'+d[1]+'</label>'});
    h+='<div class="two"><button class="btn" data-act="closemodal">Cancelar</button><button class="btn primary" data-act="docopy">Copiar</button></div>';
  }else if(m.type==='paste'){
    h+='<h2>Colar uma lista</h2><p class="sub">Um item por linha. Para quantidade, use dois pontos. Ex.: Tomate: 2 kg</p><textarea class="in" id="pt" style="min-height:180px"></textarea>'+
      '<div class="two"><button class="btn" data-act="closemodal">Cancelar</button><button class="btn primary" data-act="dopaste">Adicionar</button></div>';
  }else if(m.type==='confirm'){
    h+='<h2>'+esc(m.title)+'</h2><p class="sub">'+esc(m.text||'')+'</p><div class="two"><button class="btn" data-act="closemodal">Cancelar</button><button class="btn primary danger" data-act="doconfirm" style="background:var(--u);border-color:var(--u);color:#fff">'+esc(m.ok||'Excluir')+'</button></div>';
  }else if(m.type==='export'){
    var e=S.exp;
    h+='<h2>Baixar plano</h2><p class="sub">'+esc(S.W.paciente||'')+'. Escolha o que entra no arquivo.</p>';
    [['cardapio','Refeições da semana'],['receitas','Receitas'],['compras','Lista de compras'],['orientacoes','Recados']].forEach(function(x){
      h+='<label class="chk"><input type="checkbox" data-exp="'+x[0]+'"'+(e[x[0]]?' checked':'')+'>'+x[1]+'</label>';
    });
    h+='<div class="stack">'+
      '<button class="btn primary dbtn" data-act="dl" data-f="pdf"'+(S.busy?' disabled':'')+'>'+(S.busy==='pdf'?'Preparando…':'PDF')+'<small>Para imprimir ou mandar pelo WhatsApp</small></button>'+
      '<button class="btn dbtn" data-act="dl" data-f="docx"'+(S.busy?' disabled':'')+'>'+(S.busy==='docx'?'Preparando…':'Word')+'<small>Para a paciente editar</small></button>'+
      '<button class="btn dbtn" data-act="dl" data-f="xlsx"'+(S.busy?' disabled':'')+'>'+(S.busy==='xlsx'?'Preparando…':'Excel')+'<small>Planilha editável</small></button></div>'+
      '<div style="margin-top:10px"><button class="lnk" data-act="closemodal">Fechar</button></div>';
  }
  return h+'</div></div>';
}

/* ---------- ações ---------- */
function openModal(m){S.modal=m;render()}
function closeModal(){S.modal=null;render()}
function ensureArr(path){var v=getPath(path);if(!v){var a=path.split('.'),l=a.pop(),o=a.reduce(function(o,k){return o[k]},S.W);o[l]=[];v=o[l]}return v}

function loadList(){
  S.loading=true;S.listErr='';render();
  return DB.list().then(function(l){S.list=l}).catch(function(){S.listErr='Não consegui carregar as pacientes. Verifique a internet e recarregue.'}).then(function(){S.loading=false;render()});
}
function openPatient(id){
  S.loading=true;
  return DB.get(id).then(function(r){
    var W=normalise(r.plano||blankPlan(r.nome)),bk=null;
    try{bk=JSON.parse(localStorage.getItem(bkKey(id))||'null')}catch(e){}
    var restore=bk&&bk.t>new Date(r.atualizado).getTime()&&bk.W;
    S.cur=id;S.W=restore?normalise(bk.W):W;S.tab='ref';S.rOpen=null;S.save='ok';S.dirty=false;
    if(restore){touch();toast('Recuperei alterações que não tinham sido salvas.')}
    S.loading=false;render();window.scrollTo(0,0);
  }).catch(function(){S.loading=false;toast('Não consegui abrir essa paciente.',true)});
}
function createPatient(){
  var nome=($('mn').value||'').trim();
  if(!nome){S.modal.nome='';S.modal.err='Digite o nome da paciente.';render();return}
  var from=$('mf').value,id=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16)});
  function go(W){
    W.paciente=nome;W.inicio=todayIso();
    return DB.put(id,W).then(function(){S.list.push({id:id,nome:nome,atualizado:new Date().toISOString()});S.list.sort(function(a,b){return a.nome.localeCompare(b.nome,'pt')});S.modal=null;return openPatient(id)})
      .catch(function(){S.modal.err='Não consegui salvar. Verifique a internet e tente de novo.';render()});
  }
  if(from)return DB.get(from).then(function(r){var W=normalise(clone(r.plano));W.v=2;return go(W)}).catch(function(){S.modal.err='Não consegui copiar.';render()});
  return go(blankPlan(nome));
}

var ACT={
  logout:function(){flush().then(function(){return S.sb.auth.signOut()}).then(function(){S.user=null;S.list=[];S.cur=null;S.W=null;render()})},
  'new':function(){openModal({type:'new',focus:'#mn'})},
  open:function(d){openPatient(d.id)},
  back:function(){flush().then(function(){if(S.dirty){toast('Ainda não salvou. Aguarde um instante.',true);return}S.cur=null;S.W=null;S.modal=null;render();loadList()})},
  tab:function(d){S.tab=d.t;render()},
  day:function(d){S.day=+d.i;render()},
  pri:function(d){var it=getPath(d.path);it.p=PO[(PO.indexOf(it.p||'')+1)%4];touch();render()},
  addrow:function(d){var a=ensureArr(d.path);a.push(newItem(d.kind));touch();render(d.path+'.'+(a.length-1)+'.'+(d.kind==='food'?'t':'n'))},
  delrow:function(d){var a=getPath(d.path);a.splice(+d.i,1);
    if(/\.dias\.[a-z]+\.\d+$/.test(d.path)&&!a.length){var p=d.path.split('.'),oi=+p.pop(),parent=getPath(p.join('.'));parent.splice(oi,1)}
    touch();render()},
  addopt:function(d){var a=ensureArr(d.path);a.push([newItem('food')]);touch();render(d.path+'.'+(a.length-1)+'.0.t')},
  delopt:function(d){getPath(d.path).splice(+d.i,1);touch();render()},
  addmeal:function(){S.W.refeicoes.push(blankMeal('','',''));touch();render('refeicoes.'+(S.W.refeicoes.length-1)+'.nome')},
  mup:function(d){var i=+d.i,a=S.W.refeicoes;if(i>0){var t=a[i];a[i]=a[i-1];a[i-1]=t;touch();render()}},
  mdown:function(d){var i=+d.i,a=S.W.refeicoes;if(i<a.length-1){var t=a[i];a[i]=a[i+1];a[i+1]=t;touch();render()}},
  delmeal:function(d){var m=S.W.refeicoes[+d.i];openModal({type:'confirm',title:'Excluir "'+(m.nome||'refeição')+'"?',text:'Isso apaga a refeição de todos os dias.',what:'meal',i:+d.i})},
  copyday:function(){openModal({type:'copyday',sel:{}})},
  docopy:function(){
    var src=DIAS[S.day][0],n=0;
    document.querySelectorAll('[data-copy]').forEach(function(c){
      if(!c.checked)return;n++;
      S.W.refeicoes.forEach(function(m){var o=m.dias[src];if(o&&o.length)m.dias[c.dataset.copy]=clone(o);else delete m.dias[c.dataset.copy]});
    });
    if(!n){toast('Escolha pelo menos um dia.',true);return}
    touch();S.modal=null;render();toast('Copiado.');
  },
  addrec:function(){S.W.receitas.push({id:uid('r'),nome:'',cat:'',ing:[],prep:[],obs:''});S.rOpen=S.W.receitas.length-1;touch();render('receitas.'+S.rOpen+'.nome')},
  ropen:function(d){S.rOpen=S.rOpen===+d.i?null:+d.i;render()},
  delrec:function(d){var r=S.W.receitas[+d.i];openModal({type:'confirm',title:'Excluir "'+(r.nome||'receita')+'"?',what:'rec',i:+d.i})},
  addsec:function(){S.W.compras.push({cat:'',nota:'',itens:[newItem('shop')]});touch();render('compras.'+(S.W.compras.length-1)+'.cat')},
  delsec:function(d){var c=S.W.compras[+d.i];openModal({type:'confirm',title:'Excluir a seção "'+(c.cat||'sem nome')+'"?',what:'sec',i:+d.i})},
  paste:function(d){openModal({type:'paste',ci:+d.ci,focus:'#pt'})},
  dopaste:function(){
    var c=S.W.compras[S.modal.ci],t=$('pt').value.split('\n'),n=0;
    c.itens=c.itens.filter(function(i){return String(i.n||'').trim()||String(i.q||'').trim()});
    t.forEach(function(l){l=l.trim();if(!l)return;var k=l.indexOf(':'),nm=k>0?l.slice(0,k).trim():l,q=k>0?l.slice(k+1).trim():'';c.itens.push({n:nm,q:q});n++});
    touch();S.modal=null;render();toast(n+' itens adicionados.');
  },
  doconfirm:function(){
    var m=S.modal;
    if(m.what==='meal')S.W.refeicoes.splice(m.i,1);
    else if(m.what==='rec'){S.W.receitas.splice(m.i,1);S.rOpen=null}
    else if(m.what==='sec')S.W.compras.splice(m.i,1);
    else if(m.what==='pat'){
      var id=S.cur;S.dirty=false;clearTimeout(timer);
      DB.del(id).then(function(){S.list=S.list.filter(function(p){return p.id!==id});try{localStorage.removeItem(bkKey(id))}catch(e){}S.cur=null;S.W=null;S.modal=null;render()}).catch(function(){toast('Não consegui excluir.',true)});
      return;
    }
    touch();S.modal=null;render();
  },
  dup:function(){
    flush().then(function(){
      var W=clone(S.W);W.paciente=(W.paciente||'Paciente')+' (cópia)';
      var id=crypto.randomUUID();
      return DB.put(id,W).then(function(){S.list.push({id:id,nome:W.paciente,atualizado:new Date().toISOString()});return openPatient(id)});
    }).then(function(){S.tab='dad';render();toast('Cópia criada. Ajuste o nome.')}).catch(function(){toast('Não consegui duplicar.',true)});
  },
  delpat:function(){openModal({type:'confirm',title:'Excluir '+(S.W.paciente||'esta paciente')+'?',text:'O plano inteiro será apagado e não dá para desfazer.',what:'pat'})},
  'export':function(){openModal({type:'export'})},
  closemodal:function(d,b,e){if(e&&e.target!==b)return;S.modal=null;render()},
  create:createPatient,
  dl:function(d){doExport(d.f)}
};
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-act]');if(!b)return;
  var a=b.dataset.act;
  if(a==='closemodal'&&b.classList.contains('scrim')&&e.target!==b)return;
  if(ACT[a])ACT[a](b.dataset,b,e);
});

/* campos */
document.addEventListener('input',function(e){
  var el=e.target;if(!S.W||!S.cur)return;
  if(el.dataset.lines){setPath(el.dataset.lines,el.value.split('\n').map(function(s){return s.trim()}).filter(Boolean));touch();return}
  if(el.dataset.bind!==undefined){
    var v=el.value;
    setPath(el.dataset.bind,v);
    if(el.dataset.time){var mi=el.dataset.bind.split('.')[1];S.W.refeicoes[mi].rotulo=v?'':S.W.refeicoes[mi].rotulo}
    touch();
    if(el.dataset.bind==='paciente'){var h=document.querySelector('.top h1');if(h)h.textContent=v||'Nova paciente'}
  }
});
document.addEventListener('change',function(e){
  var el=e.target;
  if(el.dataset.exp){S.exp[el.dataset.exp]=el.checked}
  if(el.dataset.copy){S.modal.sel[el.dataset.copy]=el.checked}
});
document.addEventListener('keydown',function(e){
  var el=e.target;
  if(e.key==='Escape'&&S.modal){S.modal=null;render();return}
  if(e.key==='Enter'&&el.id==='mn'){e.preventDefault();createPatient();return}
  if(e.key==='Enter'&&el.dataset&&el.dataset.row){
    e.preventDefault();
    var p=el.dataset.bind.split('.'),f=p.pop(),i=+p.pop(),arrPath=p.join('.'),kind=el.dataset.row;
    if(f==='t'||f==='n'){var q=document.querySelector('[data-bind="'+arrPath+'.'+i+'.q"]');if(q)q.focus();return}
    var arr=getPath(arrPath);
    if(i<arr.length-1){var nx=document.querySelector('[data-bind="'+arrPath+'.'+(i+1)+'.'+(kind==='food'?'t':'n')+'"]');if(nx)nx.focus();return}
    if(!String(arr[i][kind==='food'?'t':'n']||'').trim())return;
    arr.push(newItem(kind));touch();render(arrPath+'.'+(arr.length-1)+'.'+(kind==='food'?'t':'n'));
  }
});
document.addEventListener('submit',function(e){
  if(e.target.dataset.form!=='login')return;
  e.preventDefault();
  S.loading=true;S.loginErr='';var em=$('em').value.trim(),pw=$('pw').value;S.loginEm=em;render();
  S.sb.auth.signInWithPassword({email:em,password:pw}).then(function(r){
    if(r.error)throw r.error;
    S.user=r.data.user;S.loading=false;return loadList();
  }).catch(function(err){
    S.loading=false;
    S.loginErr=(err&&/invalid/i.test(err.message||''))?'E-mail ou senha incorretos.':'Não consegui entrar. Verifique a internet e tente de novo.';
    render();
  });
});

/* ---------- exportar ---------- */
function fileBase(){return 'Plano alimentar - '+String(S.W.paciente||'paciente').replace(/[\\\/:*?"<>|]/g,'').trim()}
function doExport(f){
  if(S.busy)return;
  var W=clone(S.W),ex=clone(S.exp);
  if(!ex.cardapio&&!ex.receitas&&!ex.compras&&!ex.orientacoes){toast('Marque pelo menos uma parte.',true);return}
  S.busy=f;render();
  flush().then(function(){return loadLib(f)}).then(function(){return window.__EXP[f](W,ex)}).then(function(blob){
    var a=document.createElement('a'),url=URL.createObjectURL(blob);
    a.href=url;a.download=fileBase()+'.'+f;document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url)},4000);
    toast('Arquivo pronto.');
  }).catch(function(err){
    toast(err&&err.message==='lib'?'Sem internet para preparar o arquivo. Tente de novo.':'Não foi possível gerar o arquivo.',true);
  }).then(function(){S.busy=null;if(S.modal&&S.modal.type==='export')render()});
}

/* ---------- início ---------- */
render();
if(DB.cfgOk()){
  DB.init();
  S.sb.auth.getSession().then(function(r){
    var s=r.data&&r.data.session;
    if(s){S.user=s.user;return loadList()}
    render();
  }).catch(function(){render()});
  S.sb.auth.onAuthStateChange(function(ev){if(ev==='SIGNED_OUT'&&S.user){S.user=null;S.cur=null;render()}});
}
})();
