(function(){
"use strict";
var DIAS=[['seg','Segunda','Seg'],['ter','Terça','Ter'],['qua','Quarta','Qua'],['qui','Quinta','Qui'],['sex','Sexta','Sex'],['sab','Sábado','Sáb'],['dom','Domingo','Dom']];
var PRI={'':'Normal',u:'Não pode faltar',a:'Atenção',l:'Livre'};
function nonEmpty(it){return it&&String(it.t||'').trim()!==''}
function timeLabel(m){return m.hora||m.rotulo||''}
function dayFull(i){return DIAS[i][1]+(i<5?'-feira':'')}
function fmtDate(s){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||'');return m?m[3]+'/'+m[2]+'/'+m[1]:(s||'')}
function mealParts(m,dk){
  var opts=((m.dias||{})[dk]||[]).map(function(o){return (o||[]).filter(nonEmpty)}).filter(function(o){return o.length});
  return {todos:(m.todos||[]).filter(nonEmpty),opts:opts,fim:(m.depois||[]).filter(nonEmpty)};
}
function groups(pt){
  var g=pt.opts.length?pt.opts:[[]];
  return g.map(function(o){return pt.todos.concat(o,pt.fim)}).filter(function(a){return a.length});
}
function filled(W,dk){
  var out=[];
  W.refeicoes.forEach(function(m){var g=groups(mealParts(m,dk));if(g.length)out.push({m:m,gs:g})});
  return out;
}
function shopItems(c){return c.itens.filter(function(i){return String(i.n||'').trim()})}
function itemStr(it){return it.q?it.t+': '+it.q:it.t}
function who(W){var a=(W.membros||[]).map(function(m){return String(m.n||'').trim()}).filter(Boolean);return a.length?'Para: '+a.join(', '):''}
function head(W){return [W.nutri,W.registro].filter(Boolean).join(' · ')}

/* =========================== PDF =========================== */
function buildPDF(W,ex){
  var J=window.jspdf.jsPDF,doc=new J({unit:'mm',format:'a4',compress:true});
  doc.setProperties({title:'Plano alimentar - '+W.paciente,author:W.nutri||''});
  var PW=210,PH=297,M=18,CW=PW-2*M,FOOT=PH-18,y=M;
  var C={ink:[25,25,23],mut:[111,110,102],line:[226,225,219],u:[192,57,43],ub:[252,239,236],a:[154,98,0],ab:[251,241,214],l:[27,107,123],lb:[229,242,244],acc:[47,74,43],gr:[176,175,166]};
  function A(s){return String(s==null?'':s).replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[–—]/g,'-').replace(/…/g,'...').replace(/[•●]/g,'-').replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ]/g,'')}
  function tc(k){doc.setTextColor(C[k][0],C[k][1],C[k][2])}
  function fc(k){doc.setFillColor(C[k][0],C[k][1],C[k][2])}
  function dc(k){doc.setDrawColor(C[k][0],C[k][1],C[k][2])}
  function fs(n,st){doc.setFontSize(n);doc.setFont('helvetica',st||'normal')}
  function tx(s,x,yy,o){doc.text(A(s),x,yy,o||{})}
  function wr(s,w){return doc.splitTextToSize(A(s),w)}
  function tw(s){return doc.getTextWidth(A(s))}
  function hair(yy){dc('line');doc.setLineWidth(0.25);doc.line(M,yy,PW-M,yy)}
  function page(){doc.addPage();y=M}
  var LH=4.3;

  function lay(it,w){
    var p=it.p||'',inner=w-6-(p?30:0);
    fs(10,'bold');var tl=wr(it.t,inner);
    var q=it.q?String(it.q):'',inline=false,ql=[];
    if(q){
      if(tl.length===1){fs(10,'bold');var a=tw(tl[0]);fs(10,'normal');var b=tw(': '+q);if(a+b<=inner)inline=true}
      if(!inline){fs(10,'normal');ql=wr(q,inner)}
    }
    return {tl:tl,ql:ql,inline:inline,q:q,p:p,h:(tl.length+ql.length)*LH+2};
  }
  function drawItem(it,x,yy,w){
    var L=lay(it,w),p=L.p;
    if(p==='u'||p==='a'){fc(p+'b');doc.roundedRect(x-1.6,yy,w+3.2,L.h-0.4,1.2,1.2,'F')}
    if(p){fc(p);doc.circle(x+1.3,yy+2.9,1.05,'F')}else{fc('gr');doc.circle(x+1.3,yy+2.9,0.7,'F')}
    var by=yy+1+3.1;
    fs(10,'bold');tc('ink');L.tl.forEach(function(s,i){tx(s,x+5,by+i*LH)});
    if(L.inline){var a=tw(L.tl[0]);fs(10,'normal');tc('mut');tx(': '+L.q,x+5+a,by)}
    else if(L.ql.length){fs(10,'normal');tc('mut');L.ql.forEach(function(s,i){tx(s,x+5,by+(L.tl.length+i)*LH)})}
    if(p){fs(6.5,'bold');tc(p);tx(PRI[p].toUpperCase(),x+w-0.5,by-0.7,{align:'right',charSpace:0.25})}
    return L.h;
  }
  function h1(t){fs(22,'bold');tc('ink');tx(t,M,y+8);y+=12;hair(y);y+=5}
  function legend(){
    var x=M;fs(8.5,'normal');
    [['u','Não pode faltar'],['a','Atenção'],['l','Livre']].forEach(function(k){
      fc(k[0]);doc.circle(x+1.2,y+2,1.1,'F');tc('mut');tx(k[1],x+4,y+3);x+=tw(k[1])+12;
    });
    y+=8;
  }
  function dayHead(name,cont){
    fs(8.5,'normal');tc('mut');tx(W.paciente+' · '+(W.titulo||'Plano alimentar'),M,y+3);y+=8;
    fs(22,'bold');tc('ink');tx(name+(cont?' (continuação)':''),M,y+8);y+=12;hair(y);y+=3;
  }
  function mealBlock(g,dname){
    var lw=38,x=M+lw+3,w=CW-lw-3,gs=g.gs,rows=[],H=5;
    gs.forEach(function(items,gi){
      if(gi>0)rows.push({k:'ou',h:5});
      if(gs.length>1)rows.push({k:'lab',t:'OPÇÃO '+(gi+1),h:4.6});
      items.forEach(function(it){rows.push({k:'it',it:it,h:lay(it,w).h})});
    });
    rows.forEach(function(r){H+=r.h});
    fs(9,'normal');var nl=wr(g.m.nome,lw-2);
    var left=11+nl.length*4+(g.m.p?5:0);
    H=Math.max(H,left);
    if(y+H>FOOT){page();dayHead(dname,true)}
    if(g.m.p==='u'||g.m.p==='a'){fc(g.m.p+'b');doc.rect(M-2,y,CW+4,H,'F')}
    var t=timeLabel(g.m);
    fs(12,'bold');tc('ink');tx(t,M,y+6.5);
    fs(9,'normal');tc('mut');nl.forEach(function(s,i){tx(s,M,y+11+i*4)});
    if(g.m.p){fs(6.5,'bold');tc(g.m.p);tx(PRI[g.m.p].toUpperCase(),M,y+11+nl.length*4+1,{charSpace:0.25})}
    var yy=y+2.2;
    rows.forEach(function(r){
      if(r.k==='it')drawItem(r.it,x,yy,w);
      else if(r.k==='lab'){fs(7,'bold');tc('mut');tx(r.t,x,yy+3.2,{charSpace:0.4})}
      else{fs(8,'normal');tc('mut');tx('ou',x+w/2,yy+3.2,{align:'center'});dc('line');doc.setLineWidth(0.2);doc.line(x,yy+2.3,x+w/2-5,yy+2.3);doc.line(x+w/2+5,yy+2.3,x+w,yy+2.3)}
      yy+=r.h;
    });
    y+=H;hair(y);
  }

  /* capa */
  var hasOri=ex.orientacoes&&W.orientacoes.filter(nonEmpty).length;
  fs(8.5,'bold');tc('acc');tx('PLANO ALIMENTAR',M,y+3,{charSpace:1.4});y+=10;
  fs(28,'bold');tc('ink');wr(W.paciente||'',CW).forEach(function(s){tx(s,M,y+8);y+=11});
  y+=1;fs(10,'normal');tc('mut');tx(head(W),M,y+3);y+=5.5;
  if(who(W)){wr(who(W),CW).forEach(function(l){tx(l,M,y+3);y+=5})}
  if(W.inicio){tx('Início em '+fmtDate(W.inicio),M,y+3);y+=5.5}
  y+=4;hair(y);y+=5;legend();
  if(hasOri){
    y+=4;fs(14,'bold');tc('ink');tx('Orientações',M,y+5);y+=9;
    W.orientacoes.filter(nonEmpty).forEach(function(it){
      var h=lay(it,CW-4).h;if(y+h>FOOT)page();y+=drawItem(it,M+1.5,y,CW-4);
    });
  }
  /* cardápio */
  if(ex.cardapio){
    DIAS.forEach(function(d,i){
      if(i>0||hasOri){page()}else{y+=8}
      var name=dayFull(i);dayHead(name,false);
      var ms=filled(W,d[0]);
      if(!ms.length){fs(10,'normal');tc('mut');tx('Sem refeições cadastradas para este dia.',M,y+6);y+=10}
      ms.forEach(function(g){mealBlock(g,name)});
    });
  }
  /* receitas */
  if(ex.receitas&&W.receitas.length){
    page();h1('Receitas');
    W.receitas.forEach(function(r){
      if(y+34>FOOT)page();
      fs(14,'bold');tc('ink');wr(r.nome,CW).forEach(function(s){tx(s,M,y+5);y+=6});
      fs(8.5,'normal');tc('mut');tx([r.cat,r.rende?'Rende '+r.rende:''].filter(Boolean).join(' · '),M,y+3);y+=7;
      if(r.ing.length){fs(7.5,'bold');tc('acc');tx('INGREDIENTES',M,y+2.5,{charSpace:0.7});y+=5.5}
      r.ing.forEach(function(s){
        fs(10,'normal');var ls=wr(s,CW-6);if(y+ls.length*LH>FOOT)page();
        fc('gr');doc.circle(M+1.2,y+2.3,0.7,'F');tc('ink');ls.forEach(function(l,i){tx(l,M+5,y+3.3+i*LH)});y+=ls.length*LH+0.8;
      });
      if(r.prep.length){y+=2;fs(7.5,'bold');tc('acc');if(y+8>FOOT)page();tx('MODO DE PREPARO',M,y+2.5,{charSpace:0.7});y+=5.5}
      r.prep.forEach(function(s,i){
        fs(10,'normal');var ls=wr(s,CW-8);if(y+ls.length*LH>FOOT)page();
        fs(10,'bold');tc('acc');tx(String(i+1),M+0.5,y+3.3);fs(10,'normal');tc('ink');ls.forEach(function(l,k){tx(l,M+7,y+3.3+k*LH)});y+=ls.length*LH+1.2;
      });
      if(r.obs){
        fs(9,'normal');var ol=wr('Dica: '+r.obs,CW-8),oh=ol.length*4.2+5;if(y+oh>FOOT)page();
        fc('ab');doc.roundedRect(M,y+1,CW,oh,1.5,1.5,'F');tc('a');ol.forEach(function(l,k){tx(l,M+4,y+5.5+k*4.2)});y+=oh+1;
      }
      y+=6;
    });
  }
  /* compras */
  var cs=ex.compras?W.compras.filter(function(c){return shopItems(c).length}):[];
  if(cs.length){
    page();h1('Lista de compras');
    cs.forEach(function(c){
      var its=shopItems(c);
      if(y+24>FOOT)page();
      fs(12,'bold');tc('ink');tx(c.cat,M,y+4.5);fs(8.5,'normal');tc('mut');tx(its.length+' itens',PW-M,y+4.5,{align:'right'});y+=7;
      if(c.nota){fs(8.5,'bold');tc('a');tx(c.nota,M,y+3.2);y+=5.2}
      its.forEach(function(it){
        if(y+6.4>FOOT){page()}
        dc('mut');doc.setLineWidth(0.3);doc.roundedRect(M,y+1.1,3.6,3.6,0.6,0.6,'S');
        fs(10,'normal');tc('ink');tx(it.n,M+6.5,y+4);
        if(it.q){tc('mut');tx(it.q,PW-M,y+4,{align:'right'})}
        y+=6.4;dc('line');doc.setLineWidth(0.15);doc.line(M+6.5,y,PW-M,y);
      });
      y+=7;
    });
  }
  /* rodapé */
  var n=doc.getNumberOfPages();
  for(var i=1;i<=n;i++){
    doc.setPage(i);fs(8,'normal');tc('mut');
    tx(head(W),M,PH-10);tx(i+' / '+n,PW/2,PH-10,{align:'center'});
    if(ex.logo){var lw=19,lh=lw*ex.logo.h/ex.logo.w;try{doc.addImage(ex.logo.data,'PNG',PW-M-lw,PH-6-lh,lw,lh)}catch(e){}}
  }
  return doc.output('blob');
}

/* =========================== WORD =========================== */
function buildDOCX(W,ex){
  var d=window.docx,F='Arial';
  var C={u:'C0392B',a:'9A6200',l:'1B6B7B',ub:'FCEFEC',ab:'FBF1D6',mut:'6F6E66',line:'E2E1DB',acc:'2F4A2B',gr:'B0AFA6'};
  var NB={style:d.BorderStyle.NONE,size:0,color:'FFFFFF'};
  var HB={style:d.BorderStyle.SINGLE,size:4,color:C.line};
  function run(t,o){return new d.TextRun(Object.assign({text:String(t==null?'':t),font:F,size:20},o||{}))}
  function para(ch,o){return new d.Paragraph(Object.assign({children:ch},o||{}))}
  function itemPara(it){
    var p=it.p||'',ch=[run('●  ',{color:p?C[p]:C.gr,size:16}),run(it.t,{bold:true})];
    if(it.q)ch.push(run(': '+it.q,{color:C.mut}));
    if(p)ch.push(run('    '+PRI[p].toUpperCase().replace(/ /g,'\u00A0'),{size:13,bold:true,color:C[p]}));
    var o={spacing:{before:50,after:50}};
    if(p==='u'||p==='a')o.shading={type:d.ShadingType.CLEAR,fill:C[p+'b'],color:'auto'};
    return para(ch,o);
  }
  function label(t){return para([run(t,{size:14,bold:true,color:C.mut,characterSpacing:30})],{spacing:{before:80,after:20}})}
  function h1(t,brk){return para([run(t,{size:44,bold:true,color:'191917'})],{heading:d.HeadingLevel.HEADING_1,pageBreakBefore:!!brk,spacing:{after:200},border:{bottom:{style:d.BorderStyle.SINGLE,size:4,color:C.line,space:6}}})}
  var kids=[];
  /* capa */
  kids.push(para([run('PLANO ALIMENTAR',{size:17,bold:true,color:C.acc,characterSpacing:50})],{spacing:{after:80}}));
  kids.push(para([run(W.paciente||'',{size:60,bold:true})],{spacing:{after:80}}));
  kids.push(para([run(head(W),{color:C.mut})]));
  if(who(W))kids.push(para([run(who(W),{color:C.mut})]));
  if(W.inicio)kids.push(para([run('Início em '+fmtDate(W.inicio),{color:C.mut})],{spacing:{after:160}}));
  kids.push(para([run('●  ',{color:C.u,size:16}),run('Não pode faltar      ',{size:17,color:C.mut}),run('●  ',{color:C.a,size:16}),run('Atenção      ',{size:17,color:C.mut}),run('●  ',{color:C.l,size:16}),run('Livre',{size:17,color:C.mut})],{spacing:{after:200}}));
  var hasOri=ex.orientacoes&&W.orientacoes.filter(nonEmpty).length;
  if(hasOri){
    kids.push(para([run('Orientações',{size:28,bold:true,color:'191917'})],{heading:d.HeadingLevel.HEADING_2,spacing:{before:200,after:100}}));
    W.orientacoes.filter(nonEmpty).forEach(function(it){kids.push(itemPara(it))});
  }
  /* cardápio */
  if(ex.cardapio){
    DIAS.forEach(function(dd,i){
      kids.push(h1(dayFull(i),hasOri||i>0));
      var ms=filled(W,dd[0]);
      if(!ms.length){kids.push(para([run('Sem refeições cadastradas para este dia.',{color:C.mut})]));return}
      var rows=ms.map(function(g){
        var left=[para([run(timeLabel(g.m),{size:24,bold:true})],{spacing:{before:60}}),para([run(g.m.nome,{size:18,color:C.mut})])];
        if(g.m.p)left.push(para([run(PRI[g.m.p].toUpperCase(),{size:13,bold:true,color:C[g.m.p]})]));
        var right=[];
        g.gs.forEach(function(items,gi){
          if(gi>0)right.push(para([run('ou',{size:17,italics:true,color:C.mut})],{alignment:d.AlignmentType.CENTER,spacing:{before:40,after:40}}));
          if(g.gs.length>1)right.push(label('OPÇÃO '+(gi+1)));
          items.forEach(function(it){right.push(itemPara(it))});
        });
        var tint=(g.m.p==='u'||g.m.p==='a')?{type:d.ShadingType.CLEAR,fill:C[g.m.p+'b'],color:'auto'}:undefined;
        function cell(ch,w){var o={children:ch,width:{size:w,type:d.WidthType.DXA},margins:{top:60,bottom:100,left:80,right:80},borders:{top:NB,left:NB,right:NB,bottom:HB}};if(tint)o.shading=tint;return new d.TableCell(o)}
        return new d.TableRow({cantSplit:true,children:[cell(left,2200),cell(right,7438)]});
      });
      kids.push(new d.Table({width:{size:9638,type:d.WidthType.DXA},columnWidths:[2200,7438],rows:rows,borders:{top:NB,bottom:NB,left:NB,right:NB,insideHorizontal:HB,insideVertical:NB}}));
    });
  }
  /* receitas */
  if(ex.receitas&&W.receitas.length){
    kids.push(h1('Receitas',true));
    W.receitas.forEach(function(r,ri){
      kids.push(para([run(r.nome,{size:28,bold:true,color:'191917'})],{heading:d.HeadingLevel.HEADING_2,spacing:{before:ri?320:80,after:40},keepNext:true}));
      var meta=[r.cat,r.rende?'Rende '+r.rende:''].filter(Boolean).join(' · ');
      if(meta)kids.push(para([run(meta,{size:17,color:C.mut})],{spacing:{after:80},keepNext:true}));
      if(r.ing.length){kids.push(label('INGREDIENTES'));r.ing.forEach(function(s){kids.push(para([run('•  ',{color:C.mut}),run(s)],{indent:{left:300,hanging:300},spacing:{before:20,after:20}}))})}
      if(r.prep.length){kids.push(label('MODO DE PREPARO'));r.prep.forEach(function(s,i){kids.push(para([run((i+1)+'   ',{bold:true,color:C.acc}),run(s)],{indent:{left:360,hanging:360},spacing:{before:30,after:30}}))})}
      if(r.obs)kids.push(para([run('Dica: '+r.obs,{size:18,color:C.a})],{shading:{type:d.ShadingType.CLEAR,fill:C.ab,color:'auto'},spacing:{before:100,after:60}}));
    });
  }
  /* compras */
  var cs=ex.compras?W.compras.filter(function(c){return shopItems(c).length}):[];
  if(cs.length){
    kids.push(h1('Lista de compras',true));
    cs.forEach(function(c){
      kids.push(para([run(c.cat,{size:24,bold:true,color:'191917'})],{heading:d.HeadingLevel.HEADING_2,spacing:{before:260,after:40},keepNext:true}));
      if(c.nota)kids.push(para([run(c.nota,{size:17,bold:true,color:C.a})],{spacing:{after:60},keepNext:true}));
      var rows=shopItems(c).map(function(it){
        function cell(ch,w,al){return new d.TableCell({children:[para(ch,{alignment:al})],width:{size:w,type:d.WidthType.DXA},margins:{top:50,bottom:50,left:60,right:60},borders:{top:NB,left:NB,right:NB,bottom:HB}})}
        return new d.TableRow({cantSplit:true,children:[cell([run('☐',{font:'Segoe UI Symbol',size:22})],500),cell([run(it.n)],6000),cell([run(it.q||'',{color:C.mut})],3138,d.AlignmentType.RIGHT)]});
      });
      kids.push(new d.Table({width:{size:9638,type:d.WidthType.DXA},columnWidths:[500,6000,3138],rows:rows,borders:{top:NB,bottom:NB,left:NB,right:NB,insideHorizontal:HB,insideVertical:NB}}));
    });
  }
  var fkids=[run(head(W)+'     ',{size:16,color:C.mut}),new d.TextRun({text:'Página ',font:F,size:16,color:C.mut}),new d.TextRun({children:[d.PageNumber.CURRENT],font:F,size:16,color:C.mut})];
  if(ex.logo){var lw=62,lh=Math.round(lw*ex.logo.h/ex.logo.w);fkids.push(new d.TextRun({text:'\t'}));fkids.push(new d.ImageRun({data:new Uint8Array(ex.logo.buf),transformation:{width:lw,height:lh},type:'png'}))}
  var footer=new d.Footer({children:[new d.Paragraph({tabStops:[{type:d.TabStopType.RIGHT,position:9638}],children:fkids})]});
  var doc=new d.Document({
    creator:W.nutri||'',title:'Plano alimentar - '+(W.paciente||''),
    styles:{default:{document:{run:{font:F,size:20}}}},
    sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1134,bottom:1134,left:1134,right:1134}}},footers:{default:footer},children:kids}]
  });
  return d.Packer.toBlob(doc);
}

/* =========================== EXCEL =========================== */
function buildXLSX(W,ex){
  var X=window.ExcelJS,wb=new X.Workbook();
  wb.creator=W.nutri||'';wb.title='Plano alimentar - '+(W.paciente||'');
  var INK='FF191917',MUT='FF6F6E66',ACC='FF2F4A2B',LINE='FFE2E1DB';
  var PC={u:'FFC0392B',a:'FF9A6200',l:'FF1B6B7B'};
  function font(o){return Object.assign({name:'Arial',size:10,color:{argb:INK}},o||{})}
  function thin(){var s={style:'thin',color:{argb:LINE}};return {top:s,left:s,bottom:s,right:s}}
  function headRow(ws,r,vals){
    vals.forEach(function(v,i){var c=ws.getCell(r,i+1);c.value=v;c.font=font({bold:true,color:{argb:'FFFFFFFF'}});c.fill={type:'pattern',pattern:'solid',fgColor:{argb:ACC}};c.alignment={vertical:'middle',horizontal:'left',indent:1};c.border=thin()});
    ws.getRow(r).height=24;
  }
  function title(ws,span){
    ws.mergeCells(1,1,1,span);var c=ws.getCell(1,1);c.value=(W.titulo||'Plano alimentar')+' · '+(W.paciente||'');c.font=font({bold:true,size:16});ws.getRow(1).height=28;
    ws.mergeCells(2,1,2,span);var s=ws.getCell(2,1);s.value=[head(W),who(W),W.inicio?'Início em '+fmtDate(W.inicio):''].filter(Boolean).join(' · ');s.font=font({color:{argb:MUT}});
  }
  function est(text,width){var n=0;String(text).split('\n').forEach(function(l){n+=Math.max(1,Math.ceil(l.length/(width*1.05)))});return n}
  var PNAME={u:'não pode faltar',a:'atenção',l:'livre'};

  if(ex.cardapio){
    var ws=wb.addWorksheet('Cardápio',{views:[{state:'frozen',xSplit:1,ySplit:4}],pageSetup:{orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:9}});
    ws.columns=[{width:22}].concat(DIAS.map(function(){return {width:34}}));
    title(ws,8);
    ws.mergeCells(3,1,3,8);var lg=ws.getCell(3,1);
    lg.value={richText:[{text:'● ',font:font({color:{argb:PC.u}})},{text:'Não pode faltar     ',font:font({color:{argb:MUT}})},{text:'● ',font:font({color:{argb:PC.a}})},{text:'Atenção     ',font:font({color:{argb:MUT}})},{text:'● ',font:font({color:{argb:PC.l}})},{text:'Livre',font:font({color:{argb:MUT}})}]};
    headRow(ws,4,['Refeição'].concat(DIAS.map(function(x){return x[1]})));
    var r=5;
    W.refeicoes.forEach(function(m){
      var any=DIAS.some(function(dd){return groups(mealParts(m,dd[0])).length});if(!any)return;
      var row=ws.getRow(r),maxL=2;
      var a=row.getCell(1);
      a.value={richText:[{text:timeLabel(m)+'\n',font:font({bold:true,size:12})},{text:m.nome,font:font({color:{argb:MUT}})}]};
      a.alignment={vertical:'top',wrapText:true,indent:1};a.border=thin();
      DIAS.forEach(function(dd,i){
        var g=groups(mealParts(m,dd[0])),rt=[],txt='';
        g.forEach(function(items,gi){
          if(gi>0){rt.push({text:'ou\n',font:font({italic:true,color:{argb:MUT}})});txt+='ou\n'}
          items.forEach(function(it,k){
            var last=(gi===g.length-1&&k===items.length-1);
            var line='• '+itemStr(it)+(it.p?'  ('+PNAME[it.p]+')':'');
            rt.push({text:line+(last?'':'\n'),font:it.p?font({bold:true,color:{argb:PC[it.p]}}):font()});
            txt+=line+(last?'':'\n');
          });
        });
        var c=row.getCell(i+2);
        if(rt.length)c.value={richText:rt};
        c.alignment={vertical:'top',wrapText:true};c.border=thin();
        maxL=Math.max(maxL,est(txt,34));
      });
      row.height=Math.max(36,maxL*13.2+10);
      r++;
    });
  }
  if(ex.receitas&&W.receitas.length){
    var wr=wb.addWorksheet('Receitas',{views:[{state:'frozen',ySplit:1}]});
    wr.columns=[{width:30},{width:18},{width:44},{width:72},{width:36}];
    headRow(wr,1,['Receita','Categoria','Ingredientes','Modo de preparo','Dica']);
    W.receitas.forEach(function(rc,i){
      var ing=rc.ing.map(function(s){return '• '+s}).join('\n'),prep=rc.prep.map(function(s,k){return (k+1)+'. '+s}).join('\n');
      var row=wr.getRow(i+2);
      row.getCell(1).value=rc.nome+(rc.rende?'\n(rende '+rc.rende+')':'');row.getCell(2).value=rc.cat||'';row.getCell(3).value=ing;row.getCell(4).value=prep;row.getCell(5).value=rc.obs||'';
      for(var c=1;c<=5;c++){var cell=row.getCell(c);cell.font=font(c===1?{bold:true}:{});cell.alignment={vertical:'top',wrapText:true};cell.border=thin()}
      row.height=Math.max(30,Math.max(est(ing,44),est(prep,72),est(rc.nome,30))*13.2+10);
    });
  }
  var cs=ex.compras?W.compras.filter(function(c){return shopItems(c).length}):[];
  if(cs.length){
    var wc=wb.addWorksheet('Compras',{views:[{state:'frozen',ySplit:1}]});
    wc.columns=[{width:26},{width:44},{width:22},{width:12}];
    headRow(wc,1,['Seção','Item','Quantidade','Comprei']);
    var rr=2;
    cs.forEach(function(c){
      shopItems(c).forEach(function(it){
        var row=wc.getRow(rr++);row.getCell(1).value=c.cat;row.getCell(2).value=it.n;row.getCell(3).value=it.q||'';row.getCell(4).value='☐';
        for(var k=1;k<=4;k++){var cell=row.getCell(k);cell.font=font(k===1?{color:{argb:MUT}}:{});cell.border=thin();cell.alignment={vertical:'middle',horizontal:k===4?'center':'left',indent:k===4?0:1}}
      });
    });
    wc.autoFilter={from:{row:1,column:1},to:{row:1,column:4}};
  }
  var ori=ex.orientacoes?W.orientacoes.filter(nonEmpty):[];
  if(ori.length){
    var wo=wb.addWorksheet('Orientações',{views:[{state:'frozen',ySplit:1}]});
    wo.columns=[{width:56},{width:44},{width:20}];
    headRow(wo,1,['Orientação','Detalhe','Prioridade']);
    ori.forEach(function(it,i){
      var row=wo.getRow(i+2);row.getCell(1).value=it.t;row.getCell(2).value=it.q||'';row.getCell(3).value=it.p?PRI[it.p]:'';
      for(var k=1;k<=3;k++){var cell=row.getCell(k);cell.font=font(k===1?{bold:true}:{});cell.border=thin();cell.alignment={vertical:'top',wrapText:true,indent:1}}
      if(it.p)row.getCell(3).font=font({bold:true,color:{argb:PC[it.p]}});
      row.height=Math.max(22,Math.max(est(it.t,56),est(it.q||'',44))*13.2+8);
    });
  }
  if(!wb.worksheets.length)wb.addWorksheet('Plano');
  if(ex.logo){
    var lid=wb.addImage({base64:ex.logo.data,extension:'png'});
    wb.worksheets.forEach(function(ws){
      var lw=92,lh=Math.round(lw*ex.logo.h/ex.logo.w);
      ws.addImage(lid,{tl:{col:Math.max(0,ws.columnCount-1)+0.15,row:ws.rowCount+1},ext:{width:lw,height:lh}});
    });
  }
  return wb.xlsx.writeBuffer().then(function(buf){return new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})});
}

window.__EXP={pdf:buildPDF,docx:buildDOCX,xlsx:buildXLSX};
})();
