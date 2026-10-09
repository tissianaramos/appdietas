/* Leitura de exames e dados do paciente a partir de arquivos.
   Funciona no navegador, sem IA: procura nomes de exames conhecidos e o valor ao lado.
   Sempre vai para a tela como "conferir": a Tissi corrige o que precisar. */
(function(){
"use strict";

/* k, nome exibido, apelidos (sem acento, minúsculo; ^ = só no começo da linha), unidade padrão,
   referência padrão [min,max] (null = sem limite) ou por sexo {f:[..],m:[..]}, x1000 = laudo costuma vir em "milhares" */
var D=[
 ['glicose','Glicemia de jejum',['glicemia de jejum','glicose em jejum','glicose de jejum','glicose jejum','glicose sérica','glicose serica','glicose','glicemia'],'mg/dL',[70,99]],
 ['insulina','Insulina de jejum',['insulina de jejum','insulina basal','insulina jejum','insulina'],'µUI/mL',[2.6,24.9]],
 ['hba1c','Hemoglobina glicada (HbA1c)',['hemoglobina glicada','hemoglobina glicosilada','hemoglobina a1c','hba1c','a1c'],'%',[4,5.6]],
 ['homa','HOMA-IR',['homa ir','homa-ir','homa'],'',[0,2.5]],
 ['ct','Colesterol total',['colesterol total'],'mg/dL',[0,190]],
 ['hdl','HDL',['colesterol hdl','hdl colesterol','hdl-colesterol','hdl'],'mg/dL',[40,null]],
 ['ldl','LDL',['colesterol ldl','ldl colesterol','ldl-colesterol','ldl'],'mg/dL',[0,130]],
 ['vldl','VLDL',['colesterol vldl','vldl colesterol','vldl'],'mg/dL',[0,30]],
 ['naohdl','Colesterol não-HDL',['colesterol nao hdl','nao hdl','não hdl','colesterol nao-hdl'],'mg/dL',[0,160]],
 ['tg','Triglicerídeos',['triglicerideos','triglicerides','triglicérides','triglicerídeos','triglicerideo'],'mg/dL',[0,150]],
 ['tgo','TGO (AST)',['transaminase oxalacetica','aspartato aminotransferase','aspartato transaminase','tgo','ast'],'U/L',[5,40]],
 ['tgp','TGP (ALT)',['transaminase piruvica','alanina aminotransferase','alanina transaminase','tgp','alt'],'U/L',[7,41]],
 ['ggt','Gama GT',['gama glutamil transferase','gama glutamiltransferase','gama gt','gama-gt','ggt'],'U/L',{f:[6,42],m:[10,71]}],
 ['fa','Fosfatase alcalina',['fosfatase alcalina','^fa '],'U/L',[40,129]],
 ['bili','Bilirrubina total',['bilirrubina total'],'mg/dL',[0.2,1.2]],
 ['ureia','Ureia',['ureia','ureia serica'],'mg/dL',[15,45]],
 ['creat','Creatinina',['creatinina serica','creatinina'],'mg/dL',{f:[0.5,1.1],m:[0.7,1.3]}],
 ['urico','Ácido úrico',['acido urico'],'mg/dL',{f:[2.6,6],m:[3.5,7.2]}],
 ['tsh','TSH',['hormonio tireoestimulante','tireotrofina','tsh'],'µUI/mL',[0.4,4.5]],
 ['t4l','T4 livre',['t4 livre','tiroxina livre','t4l'],'ng/dL',[0.8,1.8]],
 ['t3l','T3 livre',['t3 livre','triiodotironina livre','t3l'],'pg/mL',[2.3,4.2]],
 ['t3','T3 total',['t3 total','triiodotironina total','^t3 '],'ng/dL',[80,200]],
 ['t4','T4 total',['t4 total','^t4 '],'µg/dL',[5.1,14.1]],
 ['atpo','Anti-TPO',['anti tpo','anti-tpo','anticorpos antiperoxidase','antiperoxidase','tpo'],'UI/mL',[0,35]],
 ['atg','Anti-tireoglobulina',['anti tireoglobulina','anti-tireoglobulina','antitireoglobulina'],'UI/mL',[0,40]],
 ['vitd','Vitamina D (25-OH)',['25 hidroxivitamina d','25 hidroxi vitamina d','25 oh vitamina d','25-oh vitamina d','25(oh) vitamina d','vitamina d 25 hidroxi','vitamina d 25-hidroxi','vitamina d (25-oh)','vitamina d 25 oh','vitamina d3','vitamina d'],'ng/mL',[30,100]],
 ['b12','Vitamina B12',['vitamina b12','cobalamina','b12'],'pg/mL',[200,900]],
 ['folato','Ácido fólico',['acido folico','folato serico','folato','vitamina b9'],'ng/mL',[3,20]],
 ['ferritina','Ferritina',['ferritina'],'ng/mL',{f:[15,150],m:[30,400]}],
 ['ferro','Ferro sérico',['ferro serico','^ferro '],'µg/dL',[60,170]],
 ['tsat','Saturação da transferrina',['saturacao da transferrina','indice de saturacao da transferrina','saturacao de transferrina','ist'],'%',[20,50]],
 ['ctlf','Capacidade de ligação do ferro',['capacidade total de ligacao do ferro','capacidade de ligacao do ferro','ctlf','tibc'],'µg/dL',[250,450]],
 ['hb','Hemoglobina',['hemoglobina','hb'],'g/dL',{f:[12,16],m:[13.5,17.5]}],
 ['ht','Hematócrito',['hematocrito','ht'],'%',{f:[36,46],m:[41,53]}],
 ['leuco','Leucócitos',['leucocitos totais','leucocitos'],'/mm³',[4000,11000],true],
 ['plaq','Plaquetas',['plaquetas'],'/mm³',[150000,450000],true],
 ['vcm','VCM',['volume corpuscular medio','vcm'],'fL',[80,100]],
 ['pcr','PCR ultrassensível',['proteina c reativa ultrassensivel','proteina c reativa ultra sensivel','pcr ultrassensivel','pcr us','pcr ultra','proteina c reativa','pcr'],'mg/L',[0,3]],
 ['homocist','Homocisteína',['homocisteina'],'µmol/L',[5,15]],
 ['cortisol','Cortisol',['cortisol basal','cortisol serico','cortisol'],'µg/dL',[6.2,19.4]],
 ['testot','Testosterona total',['testosterona total','testosterona'],'ng/dL',{f:[8,60],m:[249,836]}],
 ['testol','Testosterona livre',['testosterona livre'],'ng/dL',null],
 ['estradiol','Estradiol',['estradiol','estrogenio','17 beta estradiol'],'pg/mL',null],
 ['prog','Progesterona',['progesterona'],'ng/mL',null],
 ['dheas','DHEA-S',['sulfato de dehidroepiandrosterona','dhea sulfato','dhea-s','dheas','dhea s'],'µg/dL',null],
 ['prolac','Prolactina',['prolactina'],'ng/mL',{f:[4.8,23.3],m:[4,15.2]}],
 ['fsh','FSH',['hormonio foliculo estimulante','fsh'],'mUI/mL',null],
 ['lh','LH',['hormonio luteinizante','lh'],'mUI/mL',null],
 ['shbg','SHBG',['shbg','globulina ligadora de hormonios sexuais'],'nmol/L',null],
 ['calcio','Cálcio',['calcio total','calcio serico','calcio'],'mg/dL',[8.6,10.2]],
 ['mg','Magnésio',['magnesio serico','magnesio'],'mg/dL',[1.6,2.6]],
 ['zinco','Zinco',['zinco serico','zinco'],'µg/dL',[70,120]],
 ['na','Sódio',['sodio'],'mmol/L',[135,145]],
 ['k','Potássio',['potassio'],'mmol/L',[3.5,5.1]],
 ['fosforo','Fósforo',['fosforo'],'mg/dL',[2.5,4.5]],
 ['cobre','Cobre',['cobre serico','cobre'],'µg/dL',[70,140]],
 ['albumina','Albumina',['albumina'],'g/dL',[3.5,5.2]],
 ['proteinas','Proteínas totais',['proteinas totais'],'g/dL',[6,8.3]],
 ['psa','PSA total',['antigeno prostatico especifico total','antigeno prostatico especifico','psa total','psa'],'ng/mL',[0,4]]
];
var DICT=D.map(function(r){return {k:r[0],nome:r[1],al:r[2].map(norm),un:r[3],ref:r[4],x1000:!!r[5]}});
function norm(s){
  return String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()
    .replace(/[^a-z0-9.,%/<>µ()+\-\^: ]/g,' ').replace(/\s+/g,' ');
}
/* texto de comparação: tira hifens e parênteses para casar "LDL-Colesterol" com "ldl colesterol" */
function cmp(s){return norm(s).replace(/[()\-:]/g,' ').replace(/\s+/g,' ').trim()}
var AL=[];
DICT.forEach(function(d){d.al.forEach(function(a){
  var start=a.charAt(0)==='^';a=cmp(a.replace(/^\^/,''));
  AL.push({a:a,d:d,start:start});
})});
AL.sort(function(x,y){return y.a.length-x.a.length});

var NUM='(?:\\d{1,3}(?:\\.\\d{3})+(?:,\\d+)?|\\d+(?:[.,]\\d+)?)';
var UNITS='(?:mg\\/dl|g\\/dl|ng\\/ml|pg\\/ml|ng\\/dl|µg\\/dl|ug\\/dl|µui\\/ml|uui\\/ml|ui\\/ml|mui\\/ml|mui\\/l|ui\\/l|u\\/l|mmol\\/l|µmol\\/l|umol\\/l|nmol\\/l|mg\\/l|µg\\/l|ug\\/l|fl|%|\\/mm³|\\/mm3|mil\\/mm³|mil\\/mm3|mm3|meq\\/l)';
function toNum(s){
  s=String(s).trim();
  if(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))return parseFloat(s.replace(/\./g,'').replace(',','.'));
  return parseFloat(s.replace(',','.'));
}
function refFromText(t){
  /* referência impressa no laudo, só quando é clara (sem separar por sexo) */
  if(!t||/homens|mulheres|masc|femin|crianca|adult/.test(t))return null;
  var m=new RegExp('('+NUM+')\\s*(?:a|à|-|–|ate|até)\\s*('+NUM+')').exec(t);
  if(m){var lo=toNum(m[1]),hi=toNum(m[2]);if(lo<=hi)return {lo:lo,hi:hi,txt:m[1]+' a '+m[2]}}
  m=new RegExp('(?:<=?|inferior a|menor que|menor ou igual a|ate|até|desejavel:?|otimo:?|normal:?\\s*<)\\s*('+NUM+')').exec(t);
  if(m)return {lo:null,hi:toNum(m[1]),txt:'< '+m[1]};
  m=new RegExp('(?:>=?|superior a|maior que|maior ou igual a|acima de)\\s*('+NUM+')').exec(t);
  if(m)return {lo:toNum(m[1]),hi:null,txt:'> '+m[1]};
  return null;
}
var CU={};['mg/dL','g/dL','ng/mL','pg/mL','ng/dL','µg/dL','µUI/mL','UI/mL','mUI/mL','mUI/L','UI/L','U/L','mmol/L','µmol/L','nmol/L','mg/L','µg/L','fL','%','/mm³','mil/mm³','mEq/L'].forEach(function(u){CU[u.toLowerCase()]=u});
CU['ug/dl']='µg/dL';CU['uui/ml']='µUI/mL';CU['umol/l']='µmol/L';CU['ug/l']='µg/L';CU['/mm3']='/mm³';CU['mil/mm3']='mil/mm³';CU['mm3']='/mm³';
function canonUnit(u){return CU[String(u).toLowerCase()]||u}
function defRef(d,sexo){
  var r=d.ref;if(!r)return null;
  if(!Array.isArray(r))r=r[sexo==='m'?'m':sexo==='f'?'f':'f']||null;
  if(!r)return null;
  return {lo:r[0],hi:r[1]};
}
function refText(lo,hi){
  if(lo!=null&&hi!=null)return fmt(lo)+' a '+fmt(hi);
  if(hi!=null)return '< '+fmt(hi);
  if(lo!=null)return '> '+fmt(lo);
  return '';
}
function fmt(n){return n==null?'':String(n).replace('.',',')}

function parseText(text,sexo){
  var lines=String(text||'').split(/\r?\n/).map(function(l){return l.replace(/[ \t]+/g,' ').trim()}).filter(Boolean);
  var rows=[],seen={},data=null;
  var dm=/(?:coleta|data|realizad[oa]|emiss[aã]o|cadastro)[^0-9]{0,25}(\d{2})[\/.-](\d{2})[\/.-](\d{4})/i.exec(text);
  if(!dm)dm=/(\d{2})[\/.-](\d{2})[\/.-](20\d{2})/.exec(text);
  if(dm)data=dm[3]+'-'+dm[2]+'-'+dm[1];
  var reN=new RegExp('(?:(<=?|>=?)\\s*)?('+NUM+')','g');
  function firstNum(t){
    reN.lastIndex=0;var m;
    while((m=reN.exec(t))){
      var p=m.index>0?t.charAt(m.index-1):' ';
      if(m.index>34)return null;
      if(/[a-z]/.test(p)&&!m[1])continue;
      if(/[a-z]/.test(t.charAt(m.index+m[0].length))&&/^(\d)$/.test(t.charAt(m.index+m[0].length-1))&&!/^(mg|g|ng|pg|ug|µg|fl|mm|mil|u|ui|mui|%)/.test(t.slice(m.index+m[0].length).trim()))continue;
      return {index:m.index,0:m[0],1:m[1]||'',2:m[2]};
    }
    return null;
  }
  for(var i=0;i<lines.length;i++){
    var raw=lines[i],c=cmp(raw);
    if(!c||c.length<3)continue;
    var best=null;
    for(var j=0;j<AL.length;j++){
      var al=AL[j],idx=c.indexOf(al.a);
      if(idx<0)continue;
      var before=idx===0?'':c.charAt(idx-1),after=c.charAt(idx+al.a.length);
      if(before&&/[a-z0-9]/.test(before))continue;
      if(after&&/[a-z0-9]/.test(after))continue;
      if(al.start&&idx!==0)continue;
      if(!best||idx<best.idx||(idx===best.idx&&al.a.length>best.al.a.length))best={al:al,idx:idx};
    }
    if(!best||seen[best.al.d.k])continue;
    var d=best.al.d,tail=c.slice(best.idx+best.al.a.length);
    /* o valor pode estar na linha de baixo */
    var m=firstNum(tail);
    if(!m&&i+1<lines.length&&!/[a-z]{4,}.*\d/.test(cmp(lines[i+1]).slice(0,12))){var t2=cmp(lines[i+1]);m=firstNum(t2);if(m)tail=t2}
    if(!m||/refer/.test(tail.slice(0,m.index+m[0].length)))continue;
    var vn=toNum(m[2]);
    if(isNaN(vn))continue;
    var vtxt=(m[1]?m[1]+' ':'')+m[2];if(d.x1000&&vn<1000){vn=vn*1000;vtxt=vn.toLocaleString('pt-BR')}
    var rest=tail.slice(m.index+m[0].length);
    var um=new RegExp('^\\s*('+UNITS+')').exec(rest),un=um?canonUnit(um[1]):d.un;
    var lab=refFromText(rest.slice(um?um[0].length:0));
    var lo,hi,fonte;
    if(lab&&(d.ref!==null||true)){lo=lab.lo;hi=lab.hi;fonte='laudo'}
    else{var dr=defRef(d,sexo);if(dr){lo=dr.lo;hi=dr.hi;fonte='padrão'}else{lo=null;hi=null;fonte=''}}
    seen[d.k]=1;
    rows.push({k:d.k,nome:d.nome,v:vtxt,u:un||'',lo:lo,hi:hi,rt:refText(lo,hi),fonte:fonte,data:data||''});
  }
  /* dados do paciente */
  var t=norm(text),f={};
  var x;
  if((x=/\bsexo\s*:?\s*(feminino|masculino|f|m)\b/.exec(t)))f.sexo=x[1].charAt(0)==='m'?'m':'f';
  if((x=/nascimento\s*:?\s*(\d{2})[\/.-](\d{2})[\/.-](\d{4})/.exec(t)))f.nascimento=x[3]+'-'+x[2]+'-'+x[1];
  if((x=/\bpeso\s*(?:atual)?\s*:?\s*(\d{2,3}(?:[.,]\d+)?)\s*kg/.exec(t)))f.peso=x[1].replace(',','.');
  if((x=/\baltura\s*:?\s*(\d)[.,](\d{2})\s*m?\b/.exec(t)))f.altura=x[1]+x[2];
  else if((x=/\baltura\s*:?\s*(1\d{2})\s*cm/.exec(t)))f.altura=x[1];
  return {rows:rows,ficha:f,data:data};
}

/* status: 'alto' | 'baixo' | 'ok' | '' (sem referência) */
function status(r){
  var v=toNum(String(r.v).replace(/^[<>=\s]+/,''));
  if(isNaN(v))return '';
  var lo=r.lo==null||r.lo===''?null:Number(r.lo),hi=r.hi==null||r.hi===''?null:Number(r.hi);
  if(lo==null&&hi==null)return '';
  if(hi!=null&&v>hi)return 'alto';
  if(lo!=null&&v<lo)return 'baixo';
  return 'ok';
}

/* ---------- leitores de arquivo ---------- */
var LIB={
  pdfjs:{u:'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',ok:function(){return window.pdfjsLib}},
  mammoth:{u:'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js',ok:function(){return window.mammoth}},
  excel:{u:'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js',ok:function(){return window.ExcelJS&&window.ExcelJS.Workbook}},
  tess:{u:'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',ok:function(){return window.Tesseract}}
};
var loading={};
function lib(k){
  var L=LIB[k];if(L.ok())return Promise.resolve();
  if(loading[k])return loading[k];
  loading[k]=new Promise(function(res,rej){
    var s=document.createElement('script');s.src=L.u;
    s.onload=function(){L.ok()?res():(delete loading[k],rej(new Error('lib')))};
    s.onerror=function(){delete loading[k];rej(new Error('lib'))};
    document.head.appendChild(s);
  });
  return loading[k];
}
function ext(f){var m=/\.([a-z0-9]+)$/i.exec(f.name||'');return m?m[1].toLowerCase():''}
function readBuf(f){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result)};r.onerror=rej;r.readAsArrayBuffer(f)})}
function readTxt(f){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(String(r.result))};r.onerror=rej;r.readAsText(f)})}

var ocrWorker=null;
function ocr(source,prog){
  return lib('tess').then(function(){
    if(!ocrWorker)ocrWorker=window.Tesseract.createWorker('por',1,{
      workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
      corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1',
      langPath:'https://cdn.jsdelivr.net/npm/@tesseract.js-data/por@1.0.0/4.0.0_best_int',
      logger:function(m){if(prog&&m.status==='recognizing text')prog(m.progress)}
    });
    return ocrWorker;
  }).then(function(w){return w.recognize(source)}).then(function(r){return r.data.text});
}

function pdfText(buf,prog){
  return lib('pdfjs').then(function(){
    window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    return window.pdfjsLib.getDocument({data:new Uint8Array(buf)}).promise;
  }).then(function(pdf){
    var out=[],p=Promise.resolve();
    for(var n=1;n<=pdf.numPages;n++)(function(n){p=p.then(function(){return pdf.getPage(n)}).then(function(pg){return pg.getTextContent()}).then(function(tc){
      var rows={},ys=[];
      tc.items.forEach(function(it){
        if(!it.str)return;
        var y=Math.round(it.transform[5]/3);
        if(!rows[y]){rows[y]=[];ys.push(y)}
        rows[y].push({x:it.transform[4],s:it.str});
      });
      ys.sort(function(a,b){return b-a});
      ys.forEach(function(y){out.push(rows[y].sort(function(a,b){return a.x-b.x}).map(function(o){return o.s}).join(' '))});
      out.push('');
    })})(n);
    return p.then(function(){return {pdf:pdf,text:out.join('\n')}});
  });
}
function pdfOcr(pdf,prog){
  var texts=[],p=Promise.resolve(),N=Math.min(pdf.numPages,8);
  for(var n=1;n<=N;n++)(function(n){p=p.then(function(){return pdf.getPage(n)}).then(function(pg){
    var vp=pg.getViewport({scale:2.2}),cv=document.createElement('canvas');
    cv.width=vp.width;cv.height=vp.height;
    return pg.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise.then(function(){return ocr(cv,function(x){prog&&prog((n-1+x)/N)})});
  }).then(function(t){texts.push(t)})})(n);
  return p.then(function(){return texts.join('\n')});
}
function xlsxText(buf){
  return lib('excel').then(function(){
    var wb=new window.ExcelJS.Workbook();return wb.xlsx.load(buf);
  }).then(function(wb){
    var out=[];
    wb.eachSheet(function(ws){ws.eachRow(function(row){
      var cells=[];row.eachCell({includeEmpty:false},function(c){
        var v=c.value;if(v&&typeof v==='object'){v=v.result!=null?v.result:(v.text||v.richText&&v.richText.map(function(r){return r.text}).join('')||'')}
        if(v instanceof Date)v=v.toLocaleDateString('pt-BR');
        cells.push(String(v==null?'':v));
      });
      if(cells.length)out.push(cells.join(' '));
    })});
    return out.join('\n');
  });
}

/* lê um arquivo e devolve {rows, ficha, nota} */
function readFile(file,sexo,prog){
  var e=ext(file),mode='';
  var textP;
  if(e==='pdf'){
    textP=readBuf(file).then(function(b){return pdfText(b,prog)}).then(function(r){
      var chars=r.text.replace(/\s/g,'').length;
      if(chars>=60*r.pdf.numPages/2||chars>400)return r.text;
      mode='ocr';return pdfOcr(r.pdf,prog);
    });
  }else if(/^(png|jpe?g|webp|bmp|gif|heic)$/.test(e)||/^image\//.test(file.type)){
    mode='ocr';textP=ocr(file,prog);
  }else if(e==='xlsx'||e==='xlsm'){
    textP=readBuf(file).then(xlsxText);
  }else if(e==='docx'){
    textP=Promise.all([lib('mammoth'),readBuf(file)]).then(function(r){return window.mammoth.extractRawText({arrayBuffer:r[1]})}).then(function(r){return r.value});
  }else if(e==='csv'||e==='txt'||e==='tsv'){
    textP=readTxt(file).then(function(t){return t.replace(/[;\t]+/g,' ')});
  }else if(e==='xls'||e==='doc'){
    return Promise.reject(new Error('formato:'+e));
  }else return Promise.reject(new Error('formato:'+e));
  return textP.then(function(text){
    var r=parseText(text,sexo);
    r.ocr=mode==='ocr';r.chars=text.length;r.text=text;
    return r;
  });
}

window.EXAMES={DICT:DICT,parseText:parseText,status:status,readFile:readFile,refText:refText,toNum:toNum,norm:cmp};
})();
