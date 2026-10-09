/* Modelos de plano alimentar (templates). Gera window.TEMPLATES em JSON puro. */
(function () {
  'use strict';
  var DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

  // "Nome @ quantidade !u #id-da-receita"  (!u/!a/!l = prioridade; #id = receita ligada)
  function it(s) {
    s = s.trim();
    var r = '', p = '', m;
    m = s.match(/\s#([a-z0-9-]+)$/);
    if (m) { r = m[1]; s = s.slice(0, m.index); }
    m = s.match(/\s!([ual])$/);
    if (m) { p = m[1]; s = s.slice(0, m.index); }
    var k = s.indexOf(' @ ');
    var o = { t: (k < 0 ? s : s.slice(0, k)).trim(), q: k < 0 ? '' : s.slice(k + 3).trim(), p: p };
    if (r) o.r = r;
    return o;
  }
  function opc(s) { return s.split(' + ').map(it); }           // uma opção = itens separados por " + "
  function dia(s) { return s.split(' // ').map(opc); }          // um dia = opções separadas por " // "
  // R(id, hora, rotulo, nome, p, dias)  -> dias: string (igual nos 7 dias) ou array de 7 strings
  function R(id, hora, rotulo, nome, p, d) {
    var dd = {};
    DIAS.forEach(function (k, i) { dd[k] = dia(Array.isArray(d) ? d[i] : d); });
    return { id: id, hora: hora, rotulo: rotulo, nome: nome, p: p, todos: [], dias: dd };
  }
  function G(t, q, p) { return { t: t, q: q || '', p: p || '' }; }  // orientação
  function K(cat, nota, itens) {                                    // compras: "Item @ qtd; Item @ qtd"
    return {
      cat: cat, nota: nota || '',
      itens: itens.split(';').map(function (s) {
        var k = s.indexOf(' @ ');
        return { n: (k < 0 ? s : s.slice(0, k)).trim(), q: k < 0 ? '' : s.slice(k + 3).trim() };
      })
    };
  }

  // ---- biblioteca de receitas (cada modelo escolhe as suas) ----
  var LIB = {};
  function def(id, nome, cat, ing, prep, obs, rende) {
    LIB[id] = { id: id, nome: nome, cat: cat, ing: ing, prep: prep, obs: obs || '', rende: rende || '' };
  }
  function rc() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) {
      if (!LIB[arguments[i]]) throw new Error('Receita inexistente: ' + arguments[i]);
      out.push(JSON.parse(JSON.stringify(LIB[arguments[i]])));
    }
    return out;
  }

  var T = [];
  function M(id, nome, desc, tipo, orientacoes, refeicoes, receitas, compras) {
    T.push({
      id: id, nome: nome, desc: desc, tipo: tipo,
      plano: { titulo: 'Alimentação semanal', orientacoes: orientacoes, refeicoes: refeicoes, receitas: receitas, compras: compras }
    });
  }

  // ---------- Sucos, vitaminas e café da manhã ----------
  def('suco-verde', 'Suco verde', 'Sucos e chás',
    ['Couve: 1 folha', 'Abacaxi: 2 fatias', 'Hortelã: 4 folhas', 'Gengibre: 1 pedaço pequeno', 'Água gelada: 1 copo (200 ml)'],
    ['Bata tudo no liquidificador.', 'Sirva em seguida, sem coar.'],
    'Pode trocar o abacaxi por maçã ou limão.', '1 copo');
  def('vitamina-banana', 'Vitamina de banana', 'Sucos e chás',
    ['Banana: 1 unidade', 'Leite ou bebida vegetal: 1 copo (200 ml)', 'Canela: a gosto', 'Gelo: 2 pedras'],
    ['Bata todos os ingredientes no liquidificador.', 'Sirva gelada.'],
    'Aveia ou pasta de amendoim entram como itens à parte, quando constarem no cardápio.', '1 copo');
  def('vitamina-mamao', 'Vitamina de mamão', 'Sucos e chás',
    ['Mamão: 1 fatia média', 'Leite ou bebida vegetal: 1 copo (200 ml)', 'Gelo: 2 pedras'],
    ['Bata o mamão com o leite e o gelo.', 'Sirva em seguida.'], '', '1 copo');
  def('mingau-aveia', 'Mingau de aveia', 'Café e lanches',
    ['Aveia em flocos: 3 colheres de sopa', 'Leite ou bebida vegetal: 1 xícara', 'Canela: 1 pitada', 'Banana: 1/2 unidade picada'],
    ['Leve a aveia e o leite ao fogo baixo, mexendo sempre.', 'Cozinhe de 3 a 5 minutos, até engrossar.', 'Finalize com a canela e a banana.'],
    '', '1 porção');
  def('omelete-legumes', 'Omelete de legumes', 'Café e lanches',
    ['Ovos: 2 unidades', 'Tomate picado: 2 colheres de sopa', 'Espinafre picado: 1 punhado', 'Cebola picada: 1 colher de sopa', 'Sal: 1 pitada'],
    ['Bata os ovos com o sal.', 'Refogue a cebola, o tomate e o espinafre em frigideira antiaderente.', 'Despeje os ovos e deixe firmar dos dois lados.'],
    'Troque os legumes pelos que tiver em casa.', '1 porção');
  def('panqueca-banana', 'Panqueca de banana', 'Café e lanches',
    ['Banana madura: 1 unidade', 'Ovo: 1 unidade', 'Aveia em flocos: 2 colheres de sopa', 'Canela: a gosto'],
    ['Amasse a banana e misture com o ovo, a aveia e a canela.', 'Despeje colheradas em frigideira antiaderente.', 'Doure dos dois lados.'],
    '', '2 unidades');
  def('crepioca', 'Crepioca', 'Café e lanches',
    ['Ovo: 1 unidade', 'Goma de tapioca: 2 colheres de sopa', 'Sal: 1 pitada', 'Recheio: a gosto'],
    ['Misture o ovo, a goma e o sal.', 'Despeje em frigideira antiaderente e doure.', 'Vire, recheie e dobre.'],
    '', '1 unidade');
  def('aveia-overnight', 'Aveia de geladeira', 'Café e lanches',
    ['Aveia em flocos: 3 colheres de sopa', 'Iogurte natural: 1 pote (170 g)', 'Chia: 1 colher de sobremesa', 'Fruta picada: 1/2 xícara'],
    ['Misture a aveia, o iogurte e a chia em um pote.', 'Tampe e leve à geladeira de um dia para o outro.', 'Na hora de comer, finalize com a fruta.'],
    'Boa opção para levar ao trabalho.', '1 pote');
  def('pudim-de-chia', 'Pudim de chia', 'Café e lanches',
    ['Chia: 3 colheres de sopa', 'Leite ou bebida vegetal: 1 xícara', 'Canela: 1 pitada', 'Fruta picada: a gosto'],
    ['Misture a chia, o leite e a canela.', 'Mexa de novo após 10 minutos para não empelotar.', 'Leve à geladeira por pelo menos 4 horas e sirva com a fruta.'],
    '', '2 porções');
  def('creme-abacate', 'Creme de abacate', 'Café e lanches',
    ['Abacate maduro: 1/2 unidade', 'Banana madura: 1/2 unidade', 'Cacau em pó: 1 colher de sopa', 'Leite ou bebida vegetal: 2 colheres de sopa'],
    ['Bata tudo no processador até ficar cremoso.', 'Leve à geladeira por 30 minutos antes de servir.'],
    '', '1 porção');
  def('bolo-de-banana', 'Bolo de banana', 'Café e lanches',
    ['Banana madura: 3 unidades', 'Ovos: 2 unidades', 'Farinha de arroz: 1 xícara', 'Óleo: 3 colheres de sopa', 'Canela: 1 colher de chá', 'Fermento em pó: 1 colher de sobremesa'],
    ['Bata no liquidificador a banana, os ovos e o óleo.', 'Misture com a farinha e a canela e, por último, o fermento.', 'Asse em forma pequena untada, a 180 °C, por cerca de 30 minutos.'],
    'Sem glúten e sem lactose.', '8 fatias');
  def('cuscuz-simples', 'Cuscuz simples', 'Café e lanches',
    ['Flocão de milho: 1 xícara', 'Água: 1/2 xícara', 'Sal: 1 pitada', 'Azeite: 1 colher de chá'],
    ['Hidrate o flocão com a água, o sal e o azeite e misture bem.', 'Cozinhe na cuscuzeira por cerca de 10 minutos.'],
    '', '3 porções');
  def('pasta-grao-de-bico', 'Pasta de grão-de-bico', 'Molhos e pastas',
    ['Grão-de-bico cozido: 1 xícara', 'Suco de limão: 1/2 unidade', 'Alho: 1 dente pequeno', 'Azeite: 1 colher de sopa', 'Água: 2 a 3 colheres de sopa', 'Sal: a gosto'],
    ['Bata tudo no processador, juntando a água aos poucos.', 'Ajuste o sal e o limão.'],
    'Dura até 4 dias na geladeira.', '4 porções');
  def('pasta-ricota', 'Pasta de ricota com ervas', 'Molhos e pastas',
    ['Ricota: 4 colheres de sopa', 'Cenoura ralada: 1 colher de sopa', 'Cheiro-verde: 1 colher de sopa', 'Azeite: 1 fio', 'Sal: 1 pitada'],
    ['Amasse a ricota com um garfo.', 'Misture os demais ingredientes.'],
    '', '2 porções');
  def('molho-limao', 'Molho de limão', 'Molhos e pastas',
    ['Azeite: 3 colheres de sopa', 'Suco de limão: 1 unidade', 'Mostarda: 1 colher de chá', 'Sal: 1 pitada'],
    ['Coloque tudo em um vidro com tampa e agite bem.'],
    'Guarde na geladeira por até 5 dias.', '1 vidro pequeno');
  def('molho-tomate', 'Molho de tomate caseiro', 'Molhos e pastas',
    ['Tomate maduro: 6 unidades', 'Cebola: 1/2 unidade', 'Alho: 2 dentes', 'Azeite: 1 colher de sopa', 'Manjericão: a gosto', 'Sal: a gosto'],
    ['Refogue a cebola e o alho no azeite.', 'Junte o tomate picado e o sal e cozinhe em fogo baixo por 20 minutos.', 'Finalize com o manjericão e, se quiser, bata no liquidificador.'],
    'Guarde na geladeira por até 3 dias ou congele em porções.', '4 porções');
  def('soja-refogada', 'Soja refogada', 'Pratos principais',
    ['Proteína texturizada de soja: 1 xícara', 'Água quente: o suficiente para cobrir', 'Cebola: 1/2 unidade', 'Alho: 2 dentes', 'Tomate: 1 unidade', 'Cheiro-verde: a gosto'],
    ['Hidrate a soja na água quente por 10 minutos e escorra bem.', 'Refogue a cebola e o alho, junte o tomate e a soja.', 'Tempere e cozinhe por 5 minutos. Finalize com o cheiro-verde.'],
    '', '3 porções');

  // ---------- Sopas, pratos principais e acompanhamentos ----------
  def('sopa-legumes', 'Sopa de legumes', 'Sopas',
    ['Cenoura: 1 unidade', 'Chuchu: 1 unidade', 'Abobrinha: 1 unidade', 'Batata: 1 unidade pequena', 'Cebola: 1/2 unidade', 'Alho: 1 dente', 'Azeite: 1 colher de sopa', 'Água: 1 litro', 'Cheiro-verde: a gosto'],
    ['Refogue a cebola e o alho no azeite.', 'Junte os legumes picados e a água.', 'Cozinhe até ficarem macios e finalize com o cheiro-verde.'],
    'Pode acrescentar frango desfiado ou ovo cozido.', '4 porções');
  def('sopa-abobora', 'Sopa de abóbora', 'Sopas',
    ['Abóbora: 300 g', 'Cebola: 1/2 unidade', 'Alho: 1 dente', 'Gengibre: 1 pedaço pequeno', 'Azeite: 1 colher de sopa', 'Água: 3 xícaras'],
    ['Refogue a cebola, o alho e o gengibre no azeite.', 'Junte a abóbora em cubos e a água e cozinhe até amolecer.', 'Bata no liquidificador e acerte o sal.'],
    '', '3 porções');
  def('frango-desfiado', 'Frango desfiado', 'Pratos principais',
    ['Peito de frango: 500 g', 'Cebola: 1/2 unidade', 'Alho: 2 dentes', 'Limão: 1/2 unidade (suco)', 'Sal: a gosto', 'Água: para cozinhar'],
    ['Tempere o frango com o alho, o limão e o sal.', 'Cozinhe na panela de pressão por 15 minutos depois de pegar pressão.', 'Desfie e refogue rapidamente com a cebola.'],
    'Faz várias refeições. Guarde em potes por até 3 dias na geladeira.', '5 porções');
  def('frango-assado', 'Frango assado', 'Pratos principais',
    ['Coxa e sobrecoxa sem pele: 1 kg', 'Limão: 1 unidade', 'Alho: 4 dentes', 'Páprica: 1 colher de chá', 'Azeite: 1 colher de sopa', 'Sal: a gosto'],
    ['Tempere o frango e deixe descansar por 30 minutos.', 'Asse coberto com papel-alumínio a 200 °C por 40 minutos.', 'Retire o papel e deixe dourar por mais 15 minutos.'],
    '', '4 porções');
  def('frango-molho-tomate', 'Frango ao molho de tomate', 'Pratos principais',
    ['Peito de frango em cubos: 500 g', 'Molho de tomate caseiro: 1 xícara', 'Cebola: 1/2 unidade', 'Alho: 2 dentes', 'Azeite: 1 colher de sopa'],
    ['Refogue a cebola e o alho no azeite e doure o frango.', 'Junte o molho de tomate e cozinhe por 15 minutos.'],
    '', '4 porções');
  def('carne-moida-legumes', 'Carne moída com legumes', 'Pratos principais',
    ['Carne moída magra: 500 g', 'Cebola: 1 unidade', 'Alho: 2 dentes', 'Cenoura ralada: 1 unidade', 'Tomate: 2 unidades', 'Cheiro-verde: a gosto'],
    ['Refogue a cebola e o alho e junte a carne, mexendo até secar.', 'Acrescente o tomate e a cenoura e cozinhe por 10 minutos.', 'Finalize com o cheiro-verde.'],
    'Boa para marmitas. Congela bem.', '5 porções');
  def('carne-panela', 'Carne de panela com legumes', 'Pratos principais',
    ['Acém ou patinho em cubos: 600 g', 'Cenoura: 2 unidades', 'Batata: 2 unidades', 'Cebola: 1 unidade', 'Alho: 3 dentes', 'Tomate: 2 unidades', 'Azeite: 1 colher de sopa'],
    ['Doure a carne no azeite com a cebola e o alho.', 'Junte o tomate e água até cobrir e cozinhe na pressão por 25 minutos.', 'Acrescente a cenoura e a batata e cozinhe até ficarem macias.'],
    'Deve ficar bem cozida e sem partes cruas.', '5 porções');
  def('almondegas-forno', 'Almôndegas assadas', 'Pratos principais',
    ['Carne moída magra: 500 g', 'Ovo: 1 unidade', 'Cebola ralada: 2 colheres de sopa', 'Farinha de arroz: 2 colheres de sopa', 'Salsinha: a gosto', 'Alho e sal: a gosto'],
    ['Misture todos os ingredientes e modele as bolinhas.', 'Disponha em assadeira untada.', 'Asse a 200 °C por 25 minutos, virando na metade do tempo.'],
    'Congela bem.', '16 unidades');
  def('peixe-assado', 'Peixe assado ao limão', 'Pratos principais',
    ['Filé de tilápia: 4 unidades', 'Limão: 1 unidade', 'Alho: 2 dentes', 'Azeite: 1 colher de sopa', 'Ervas secas: 1 pitada', 'Sal: a gosto'],
    ['Tempere os filés com o limão, o alho e o sal e deixe por 15 minutos.', 'Coloque em assadeira com um fio de azeite e as ervas.', 'Asse a 200 °C por 15 a 20 minutos.'],
    '', '4 porções');
  def('lentilha-temperada', 'Lentilha temperada', 'Pratos principais',
    ['Lentilha: 1 xícara', 'Cenoura: 1 unidade em cubos', 'Cebola: 1/2 unidade', 'Alho: 2 dentes', 'Louro: 1 folha', 'Azeite: 1 colher de sopa'],
    ['Refogue a cebola e o alho no azeite.', 'Junte a lentilha, a cenoura, o louro e água até cobrir.', 'Cozinhe até a lentilha ficar macia, por cerca de 25 minutos.'],
    'Não precisa de molho prévio.', '4 porções');
  def('hamburguer-lentilha', 'Hambúrguer de lentilha', 'Pratos principais',
    ['Lentilha cozida: 1 xícara', 'Cenoura ralada: 1/2 unidade', 'Cebola ralada: 2 colheres de sopa', 'Farinha de arroz: 2 colheres de sopa', 'Cominho: 1 pitada', 'Sal: a gosto'],
    ['Amasse a lentilha e misture com os demais ingredientes.', 'Modele os hambúrgueres.', 'Grelhe em frigideira antiaderente ou asse a 200 °C por 15 minutos.'],
    '', '6 unidades');
  def('frittata-forno', 'Omelete assada', 'Pratos principais',
    ['Ovos: 6 unidades', 'Legumes picados (abobrinha, tomate, espinafre): 2 xícaras', 'Queijo ralado: 3 colheres de sopa (opcional)', 'Azeite: 1 fio', 'Sal: a gosto'],
    ['Misture os ovos com os legumes e o sal.', 'Despeje em forma untada.', 'Asse a 180 °C por 25 minutos, até firmar por inteiro.'],
    'Sem lactose: omita o queijo ou use um queijo sem lactose.', '4 porções');
  def('escondidinho-batata-doce', 'Escondidinho de batata-doce', 'Pratos principais',
    ['Batata-doce: 3 unidades médias', 'Frango desfiado: 2 xícaras', 'Cebola: 1/2 unidade', 'Tomate: 1 unidade', 'Azeite: 1 colher de sopa', 'Sal e ervas: a gosto'],
    ['Cozinhe e amasse a batata-doce com sal.', 'Refogue o frango com a cebola e o tomate.', 'Monte em camadas e asse a 200 °C por 15 minutos.'],
    '', '4 porções');
  def('escondidinho-lentilha', 'Escondidinho de lentilha', 'Pratos principais',
    ['Batata-doce: 3 unidades médias', 'Lentilha cozida: 2 xícaras', 'Cebola: 1/2 unidade', 'Tomate: 1 unidade', 'Azeite: 1 colher de sopa', 'Sal e ervas: a gosto'],
    ['Cozinhe e amasse a batata-doce com sal.', 'Refogue a lentilha com a cebola e o tomate.', 'Monte em camadas e asse a 200 °C por 15 minutos.'],
    '', '4 porções');
  def('salada-grao-de-bico', 'Salada de grão-de-bico', 'Acompanhamentos',
    ['Grão-de-bico cozido: 1 xícara', 'Tomate: 1 unidade', 'Pepino: 1/2 unidade', 'Cebola roxa picada: 2 colheres de sopa', 'Salsinha: a gosto', 'Azeite: 1 colher de sopa', 'Suco de limão: 1/2 unidade'],
    ['Pique os legumes em cubos pequenos.', 'Misture tudo e tempere com o azeite, o limão e o sal.'],
    'Boa para marmita. Dura 2 dias na geladeira.', '2 porções');
  def('legumes-assados', 'Legumes assados', 'Acompanhamentos',
    ['Abobrinha: 1 unidade', 'Berinjela: 1/2 unidade', 'Brócolis: 1 xícara', 'Cenoura: 1 unidade', 'Azeite: 1 colher de sopa', 'Ervas e sal: a gosto'],
    ['Corte os legumes em pedaços parecidos.', 'Misture com o azeite, as ervas e o sal.', 'Asse a 200 °C por 25 minutos, virando uma vez.'],
    'Troque pelos legumes da estação.', '4 porções');
  def('pure-couve-flor', 'Purê de couve-flor', 'Acompanhamentos',
    ['Couve-flor: 1/2 cabeça (400 g)', 'Azeite: 1 colher de sopa', 'Alho: 1 dente', 'Sal: a gosto'],
    ['Cozinhe a couve-flor no vapor por 10 a 12 minutos.', 'Bata no processador com o azeite e o alho.', 'Acerte o sal.'],
    '', '3 porções');
  def('arroz-couve-flor', 'Arroz de couve-flor', 'Acompanhamentos',
    ['Couve-flor: 1/2 cabeça', 'Alho: 1 dente', 'Azeite: 1 colher de sopa', 'Salsinha: a gosto', 'Sal: a gosto'],
    ['Processe a couve-flor até virar pedacinhos.', 'Refogue o alho no azeite, junte a couve-flor e mexa por 3 a 4 minutos.', 'Finalize com a salsinha.'],
    '', '3 porções');
  def('muffin-de-ovo', 'Muffin de ovo', 'Café e lanches',
    ['Ovos: 4 unidades', 'Espinafre picado: 1/2 xícara', 'Tomate picado: 1/2 xícara', 'Queijo picado: 3 colheres de sopa', 'Sal: a gosto'],
    ['Bata os ovos com o sal e misture os demais ingredientes.', 'Distribua em forminhas de silicone.', 'Asse a 180 °C por 20 minutos, até firmar.'],
    'Rende para o café da manhã e para marmitas. Guarde na geladeira por até 3 dias.', '6 unidades');
  def('feijao-de-casa', 'Feijão de casa', 'Acompanhamentos',
    ['Feijão carioca cru: 2 xícaras', 'Alho: 3 dentes', 'Cebola: 1/2 unidade', 'Louro: 2 folhas', 'Azeite: 1 colher de sopa', 'Sal: a gosto'],
    ['Deixe o feijão de molho por 8 horas e descarte a água.', 'Cozinhe na pressão por 25 minutos com água e o louro.', 'Refogue o alho e a cebola no azeite, junte ao feijão e acerte o sal.'],
    'Congele em potes individuais.', '8 porções');
  def('arroz-soltinho', 'Arroz soltinho', 'Acompanhamentos',
    ['Arroz: 2 xícaras', 'Alho: 2 dentes', 'Cebola: 1/4 unidade', 'Azeite: 1 colher de sopa', 'Água quente: 4 xícaras', 'Sal: a gosto'],
    ['Refogue o alho e a cebola no azeite e junte o arroz.', 'Acrescente a água quente e o sal.', 'Cozinhe com a panela semitampada até secar e deixe abafado por 5 minutos.'],
    '', '6 porções');

  // =============== 1. REEDUCAÇÃO ALIMENTAR ===============
  (function () {
    var A = 'Maçã @ 1 unidade + Castanha-do-pará @ 2 unidades';
    var B = 'Iogurte natural @ 1 pote (170 g) + Mamão @ 1 fatia pequena';
    var C = 'Banana @ 1 unidade + Aveia em flocos @ 1 colher de sopa';
    var AR = 'Arroz integral @ 3 colheres de sopa';
    var FE = 'Feijão carioca @ 1 concha';
    M('reeducacao', 'Reeducação alimentar', 'Rotina equilibrada para o dia a dia, sem restrições', 'individual',
      [
        G('Monte o prato com cores', 'Metade de legumes e folhas, um quarto de proteína e um quarto de carboidrato.', 'u'),
        G('Beba água ao longo do dia', 'Deixe uma garrafa por perto e beba aos poucos, mesmo sem sede.'),
        G('Mastigue devagar', 'Faça pausas entre as garfadas e evite telas durante as refeições.'),
        G('Planeje a semana', 'Escolha um dia para as compras e para adiantar preparos, como o feijão e o frango desfiado.'),
        G('Evite pular refeições', 'Os lanches ajudam a chegar com menos fome ao almoço e ao jantar.')
      ],
      [
        R('cafe', '07:00', '', 'Café da manhã', '', [
          'Pão integral @ 2 fatias + Ovo mexido @ 2 unidades + Mamão @ 1 fatia média + Café sem açúcar @ 1 xícara pequena // Iogurte natural @ 1 pote (170 g) + Aveia em flocos @ 2 colheres de sopa + Banana @ 1 unidade',
          'Tapioca @ 3 colheres de sopa + Queijo minas frescal @ 1 fatia + Ovo cozido @ 1 unidade + Laranja @ 1 unidade // Pão integral @ 2 fatias + Ricota @ 2 colheres de sopa + Morango @ 5 unidades',
          'Cuscuz @ 1 fatia + Ovo mexido @ 2 unidades + Mamão @ 1 fatia média // Vitamina de banana @ 1 copo (300 ml) #vitamina-banana + Aveia em flocos @ 1 colher de sopa + Torrada integral @ 2 unidades',
          'Pão integral @ 2 fatias + Queijo minas frescal @ 2 fatias + Tomate @ 4 rodelas + Café sem açúcar @ 1 xícara pequena // Mingau de aveia @ 1 tigela pequena #mingau-aveia + Maçã @ 1 unidade',
          'Omelete de legumes @ 2 ovos #omelete-legumes + Pão integral @ 1 fatia + Melancia @ 1 fatia média // Iogurte natural @ 1 pote (170 g) + Granola sem açúcar @ 2 colheres de sopa + Banana @ 1 unidade',
          'Panqueca de banana @ 2 unidades #panqueca-banana + Café com leite @ 1 xícara // Pão integral @ 2 fatias + Pasta de amendoim @ 1 colher de sobremesa + Mamão @ 1 fatia média',
          'Crepioca @ 1 unidade #crepioca + Queijo minas frescal @ 1 fatia + Suco de laranja natural @ 1 copo pequeno // Cuscuz @ 1 fatia + Queijo coalho @ 1 espeto + Banana @ 1 unidade'
        ]),
        R('lanche-manha', '10:00', '', 'Lanche da manhã', '', [
          A + ' // ' + B, B + ' // ' + C, A + ' // ' + C, B + ' // ' + A, C + ' // ' + A, A + ' // ' + B, B + ' // ' + C
        ]),
        R('almoco', '12:30', '', 'Almoço', '', [
          AR + ' + ' + FE + ' + Frango grelhado @ 1 filé médio + Salada de alface e tomate @ à vontade + Cenoura cozida @ 2 colheres de sopa // ' + AR + ' + ' + FE + ' + Carne moída refogada @ 3 colheres de sopa + Salada de repolho @ à vontade + Abobrinha refogada @ 3 colheres de sopa',
          'Arroz @ 3 colheres de sopa + ' + FE + ' + Tilápia assada @ 1 filé médio + Brócolis cozido @ 3 colheres de sopa + Salada de folhas @ à vontade // Macarrão integral @ 1 pegador + Molho de tomate caseiro @ 3 colheres de sopa #molho-tomate + Frango desfiado @ 3 colheres de sopa #frango-desfiado + Salada de rúcula @ à vontade',
          AR + ' + ' + FE + ' + Patinho grelhado @ 1 bife médio + Chuchu refogado @ 3 colheres de sopa + Salada de alface @ à vontade // Escondidinho de frango com batata-doce @ 1 porção #escondidinho-batata-doce + Salada de folhas com tomate @ à vontade',
          'Arroz @ 3 colheres de sopa + Lentilha cozida @ 1 concha + Ovo cozido @ 2 unidades + Couve refogada @ 2 colheres de sopa + Salada de tomate e pepino @ à vontade // ' + AR + ' + ' + FE + ' + Sobrecoxa assada sem pele @ 1 unidade + Vagem refogada @ 3 colheres de sopa + Salada de alface @ à vontade',
          AR + ' + ' + FE + ' + Carne de panela desfiada @ 3 colheres de sopa + Quiabo refogado @ 3 colheres de sopa + Salada de folhas @ à vontade // Arroz @ 3 colheres de sopa + ' + FE + ' + Frango grelhado com ervas @ 1 filé médio + Salada de repolho e cenoura @ à vontade',
          'Arroz @ 3 colheres de sopa + ' + FE + ' + Coxa de frango assada sem pele @ 1 unidade + Purê de batata-doce @ 2 colheres de sopa + Salada de folhas @ à vontade // ' + AR + ' + ' + FE + ' + Pescada assada @ 1 filé médio + Legumes cozidos @ 3 colheres de sopa + Salada de alface @ à vontade',
          'Refeição livre @ aproveite com atenção, sem exageros !l // ' + AR + ' + ' + FE + ' + Frango assado @ 1 coxa e 1 sobrecoxa + Maionese de legumes @ 2 colheres de sopa + Salada de folhas @ à vontade'
        ]),
        R('lanche-tarde', '16:00', '', 'Lanche da tarde', '', [
          'Iogurte natural @ 1 pote (170 g) + Banana @ 1 unidade + Aveia em flocos @ 1 colher de sopa // Pão integral @ 1 fatia + Queijo minas frescal @ 1 fatia + Chá sem açúcar @ 1 xícara',
          'Suco verde @ 1 copo #suco-verde + Castanha-de-caju @ 5 unidades // Tapioca @ 2 colheres de sopa + Queijo minas frescal @ 1 fatia',
          'Mamão @ 1 fatia média + Granola sem açúcar @ 1 colher de sopa // Pão integral @ 1 fatia + Pasta de amendoim @ 1 colher de sobremesa',
          'Iogurte natural @ 1 pote (170 g) + Morango @ 5 unidades // Torrada integral @ 2 unidades + Ricota @ 2 colheres de sopa + Chá sem açúcar @ 1 xícara',
          'Maçã @ 1 unidade + Amêndoas @ 8 unidades // Vitamina de banana @ 1 copo (300 ml) #vitamina-banana',
          'Pipoca sem manteiga @ 2 xícaras + Laranja @ 1 unidade // Iogurte natural @ 1 pote (170 g) + Banana @ 1 unidade',
          'Pão integral @ 1 fatia + Ovo cozido @ 1 unidade + Chá sem açúcar @ 1 xícara // Mamão @ 1 fatia média + Castanha-do-pará @ 2 unidades'
        ]),
        R('jantar', '19:30', '', 'Jantar', '', [
          'Sopa de legumes com frango @ 1 prato fundo #sopa-legumes + Torrada integral @ 2 unidades // Omelete de legumes @ 2 ovos #omelete-legumes + Salada de folhas @ à vontade + Arroz @ 2 colheres de sopa',
          'Pão integral @ 2 fatias + Frango desfiado @ 3 colheres de sopa #frango-desfiado + Alface e tomate @ à vontade // Tilápia grelhada @ 1 filé médio + Legumes assados @ 1 prato de sobremesa + Purê de batata-doce @ 2 colheres de sopa',
          'Arroz @ 2 colheres de sopa + Feijão carioca @ 1/2 concha + Ovo mexido @ 2 unidades + Salada de folhas @ à vontade // Salada de folhas, tomate e pepino @ 1 prato + Atum ao natural @ 1/2 lata + Grão-de-bico cozido @ 2 colheres de sopa',
          'Crepioca @ 1 unidade #crepioca + Queijo minas frescal @ 1 fatia + Salada de folhas @ à vontade // Frango grelhado @ 1 filé pequeno + Legumes refogados @ 1 prato de sobremesa + Purê de abóbora @ 2 colheres de sopa',
          'Sopa de legumes @ 1 prato fundo #sopa-legumes + Pão integral @ 1 fatia // Tapioca @ 3 colheres de sopa + Queijo minas frescal @ 1 fatia + Tomate @ 4 rodelas + Salada de folhas @ à vontade',
          'Omelete de legumes @ 2 ovos #omelete-legumes + Pão integral @ 1 fatia + Salada de folhas @ à vontade // Escondidinho de frango com batata-doce @ 1 porção pequena #escondidinho-batata-doce + Salada de folhas @ à vontade',
          'Pão integral @ 2 fatias + Queijo minas frescal @ 2 fatias + Tomate e alface @ à vontade + Suco verde @ 1 copo #suco-verde // Sopa de legumes com ovo cozido @ 1 prato fundo #sopa-legumes'
        ]),
        R('ceia', '21:30', '', 'Ceia', '', 'Iogurte natural @ 1 pote pequeno (120 g) // Chá de erva-doce sem açúcar @ 1 xícara + Maçã @ 1 unidade')
      ],
      rc('vitamina-banana', 'mingau-aveia', 'omelete-legumes', 'panqueca-banana', 'crepioca', 'molho-tomate', 'sopa-legumes', 'escondidinho-batata-doce', 'frango-desfiado', 'suco-verde'),
      [
        K('Hortifruti', 'Escolha o que estiver da estação', 'Alface @ 2 pés; Tomate @ 1 kg; Cenoura @ 500 g; Brócolis @ 1 maço; Abobrinha @ 3 unidades; Chuchu @ 2 unidades; Couve @ 1 maço; Batata-doce @ 1 kg; Cebola @ 500 g; Alho @ 1 cabeça; Banana @ 1 dúzia; Maçã @ 6 unidades; Mamão @ 1 unidade; Laranja @ 6 unidades; Morango @ 1 bandeja; Limão @ 4 unidades'),
        K('Proteínas', '', 'Peito de frango @ 1 kg; Sobrecoxa e coxa @ 600 g; Carne moída magra @ 400 g; Patinho em bifes @ 300 g; Tilápia ou pescada @ 400 g; Ovos @ 1 dúzia e meia; Atum ao natural @ 1 lata'),
        K('Grãos e massas', '', 'Arroz integral @ 500 g; Feijão carioca @ 500 g; Lentilha @ 250 g; Grão-de-bico @ 250 g; Macarrão integral @ 250 g; Aveia em flocos @ 1 pacote; Granola sem açúcar @ 1 pacote pequeno'),
        K('Laticínios', '', 'Iogurte natural @ 8 potes; Queijo minas frescal @ 300 g; Ricota @ 1 unidade; Leite @ 1 litro; Queijo coalho @ 1 espeto'),
        K('Padaria e mercearia', '', 'Pão integral @ 1 pacote; Torrada integral @ 1 pacote; Tapioca (goma) @ 1 pacote; Flocão de milho @ 1 pacote; Pasta de amendoim @ 1 pote; Castanhas e amêndoas @ 1 pacote pequeno; Azeite @ 1 vidro; Café e chá @ a gosto')
      ]);
  })();

  // =============== 2. EMAGRECIMENTO ===============
  (function () {
    var A = 'Maçã @ 1 unidade + Castanha-do-pará @ 2 unidades';
    var B = 'Iogurte natural @ 1 pote pequeno (120 g) + Chia @ 1 colher de chá';
    var C = 'Pera @ 1 unidade + Queijo minas frescal @ 1 fatia';
    var AR = 'Arroz integral @ 2 colheres de sopa';
    var FE = 'Feijão carioca @ 1 concha';
    var SF = 'Salada de folhas, tomate e pepino @ 1 prato de sobremesa';
    M('emagrecimento', 'Emagrecimento', 'Déficit leve, com mais fibra, proteína e saciedade', 'individual',
      [
        G('Inclua proteína nas refeições principais', 'Ovos, frango, peixe, carnes magras, leguminosas e iogurte natural dão mais saciedade.', 'u'),
        G('Comece o almoço e o jantar pela salada', 'Folhas e legumes primeiro ajudam a controlar a fome.'),
        G('Beba água ao longo do dia', 'Mantenha uma garrafa à vista e beba aos poucos.'),
        G('Evite líquidos com açúcar', 'Prefira água, chás e café sem açúcar. Suco, só o que estiver no plano.'),
        G('Deixe preparos prontos', 'Frango desfiado, legumes assados e almôndegas congeladas facilitam a rotina.')
      ],
      [
        R('acordar', '', 'Ao acordar', 'Primeiro copo do dia', '', 'Água @ 1 copo (200 ml) // Chá sem açúcar @ 1 xícara'),
        R('cafe', '07:30', '', 'Café da manhã', '', [
          'Ovo mexido @ 2 unidades + Pão integral @ 1 fatia + Mamão @ 1 fatia média + Café sem açúcar @ 1 xícara pequena // Iogurte natural @ 1 pote (170 g) + Aveia em flocos @ 2 colheres de sopa + Morango @ 5 unidades',
          'Omelete de legumes @ 2 ovos #omelete-legumes + Tomate @ 4 rodelas + Laranja @ 1 unidade // Crepioca @ 1 unidade #crepioca + Queijo minas frescal @ 1 fatia + Café sem açúcar @ 1 xícara pequena',
          'Aveia de geladeira @ 1 pote #aveia-overnight + Café sem açúcar @ 1 xícara pequena // Pão integral @ 1 fatia + Ricota @ 2 colheres de sopa + Ovo cozido @ 1 unidade + Melancia @ 1 fatia média',
          'Pudim de chia @ 1 porção #pudim-de-chia + Banana @ 1/2 unidade // Cuscuz @ 1 fatia pequena + Ovo mexido @ 2 unidades + Mamão @ 1 fatia média',
          'Crepioca @ 1 unidade #crepioca + Frango desfiado @ 2 colheres de sopa #frango-desfiado + Laranja @ 1 unidade // Iogurte natural @ 1 pote (170 g) + Granola sem açúcar @ 1 colher de sopa + Maçã @ 1 unidade',
          'Omelete de legumes @ 2 ovos #omelete-legumes + Pão integral @ 1 fatia + Mamão @ 1 fatia média // Iogurte natural @ 1 pote (170 g) + Chia @ 1 colher de sobremesa + Morango @ 5 unidades',
          'Pão integral @ 2 fatias + Queijo minas frescal @ 2 fatias + Ovo cozido @ 1 unidade + Suco verde @ 1 copo #suco-verde // Tapioca @ 3 colheres de sopa + Ovo mexido @ 2 unidades + Maçã @ 1 unidade'
        ]),
        R('lanche-manha', '10:00', '', 'Lanche da manhã', '', [
          A + ' // ' + B, B + ' // ' + C, C + ' // ' + A, A + ' // ' + B, B + ' // ' + C, C + ' // ' + A, A + ' // ' + C
        ]),
        R('almoco', '12:30', '', 'Almoço', '', [
          SF + ' + ' + AR + ' + ' + FE + ' + Frango grelhado @ 1 filé médio + Brócolis cozido @ 4 colheres de sopa // ' + SF + ' + ' + AR + ' + ' + FE + ' + Carne moída com legumes @ 3 colheres de sopa #carne-moida-legumes + Abobrinha refogada @ 3 colheres de sopa',
          'Peixe assado ao limão @ 1 filé médio #peixe-assado + Legumes assados @ 1 prato de sobremesa #legumes-assados + ' + AR + ' + Salada de rúcula @ à vontade // Almôndegas assadas @ 4 unidades #almondegas-forno + ' + AR + ' + ' + FE + ' + Salada de repolho e cenoura @ à vontade',
          'Frango desfiado @ 4 colheres de sopa #frango-desfiado + ' + AR + ' + ' + FE + ' + Couve refogada @ 3 colheres de sopa + ' + SF + ' // Patinho grelhado @ 1 bife médio + ' + AR + ' + Lentilha cozida @ 1 concha + Vagem refogada @ 3 colheres de sopa + ' + SF,
          'Sobrecoxa assada sem pele @ 1 unidade + Legumes assados @ 1 prato de sobremesa #legumes-assados + ' + AR + ' + Salada de folhas @ à vontade // Tilápia grelhada @ 1 filé médio + Grão-de-bico cozido @ 3 colheres de sopa + Brócolis cozido @ 4 colheres de sopa + ' + SF,
          'Frango grelhado @ 1 filé médio + ' + AR + ' + ' + FE + ' + Quiabo refogado @ 3 colheres de sopa + Salada de alface e tomate @ à vontade // Carne moída com legumes @ 3 colheres de sopa #carne-moida-legumes + ' + AR + ' + Chuchu cozido @ 3 colheres de sopa + ' + SF,
          'Salada de folhas, tomate e cenoura ralada @ 1 prato grande + Frango desfiado @ 4 colheres de sopa #frango-desfiado + Grão-de-bico cozido @ 3 colheres de sopa + Molho de limão @ 1 colher de sopa #molho-limao // Peixe assado ao limão @ 1 filé médio #peixe-assado + ' + AR + ' + Legumes cozidos @ 4 colheres de sopa + Salada de folhas @ à vontade',
          'Refeição livre @ aproveite com atenção, sem exageros !l // Frango assado sem pele @ 1 coxa + ' + AR + ' + ' + FE + ' + ' + SF
        ]),
        R('lanche-tarde', '16:00', '', 'Lanche da tarde', '', [
          'Iogurte natural @ 1 pote (170 g) + Morango @ 5 unidades // Ovo cozido @ 1 unidade + Fruta @ 1 unidade pequena',
          'Suco verde @ 1 copo #suco-verde + Castanha-de-caju @ 5 unidades // Pão integral @ 1 fatia + Queijo minas frescal @ 1 fatia',
          'Mamão @ 1 fatia média + Granola sem açúcar @ 1 colher de sopa // Iogurte natural @ 1 pote (170 g) + Chia @ 1 colher de chá',
          'Maçã @ 1 unidade + Amêndoas @ 8 unidades // Creme de ricota @ 2 colheres de sopa + Cenoura em palitos @ 1 unidade',
          'Pipoca sem manteiga @ 2 xícaras + Laranja @ 1 unidade // Iogurte natural @ 1 pote (170 g) + Banana @ 1/2 unidade',
          'Ovo cozido @ 1 unidade + Tomate-cereja @ 6 unidades // Pudim de chia @ 1 porção #pudim-de-chia',
          'Pão integral @ 1 fatia + Ricota @ 2 colheres de sopa + Chá sem açúcar @ 1 xícara // Mamão @ 1 fatia média + Castanha-do-pará @ 2 unidades'
        ]),
        R('jantar', '19:30', '', 'Jantar', '', [
          'Sopa de legumes com frango @ 1 prato fundo #sopa-legumes // Omelete de legumes @ 2 ovos #omelete-legumes + Salada de folhas @ à vontade',
          'Frango desfiado @ 4 colheres de sopa #frango-desfiado + Legumes assados @ 1 prato de sobremesa #legumes-assados + Salada de folhas @ à vontade // Crepioca @ 1 unidade #crepioca + Queijo minas frescal @ 1 fatia + Salada de folhas @ à vontade',
          'Tilápia grelhada @ 1 filé médio + Legumes cozidos @ 1 prato de sobremesa + Salada de folhas @ à vontade // Salada de folhas, tomate e pepino @ 1 prato + Atum ao natural @ 1/2 lata + Grão-de-bico cozido @ 2 colheres de sopa',
          'Sopa de legumes com ovo cozido @ 1 prato fundo #sopa-legumes // Almôndegas assadas @ 3 unidades #almondegas-forno + Abobrinha refogada @ 4 colheres de sopa + Salada de folhas @ à vontade',
          'Omelete de legumes @ 2 ovos #omelete-legumes + Pão integral @ 1 fatia + Salada de folhas @ à vontade // Peixe assado ao limão @ 1 filé pequeno #peixe-assado + Legumes assados @ 1 prato de sobremesa #legumes-assados',
          'Sopa de legumes @ 1 prato fundo #sopa-legumes + Queijo minas frescal @ 1 fatia // Frango grelhado @ 1 filé pequeno + Brócolis e cenoura cozidos @ 1 prato de sobremesa',
          'Crepioca @ 1 unidade #crepioca + Frango desfiado @ 2 colheres de sopa #frango-desfiado + Salada de folhas @ à vontade // Sopa de legumes @ 1 prato fundo #sopa-legumes + Ovo cozido @ 1 unidade'
        ]),
        R('ceia', '21:30', '', 'Ceia', '', 'Iogurte natural @ 1 pote pequeno (120 g) // Chá de camomila sem açúcar @ 1 xícara + Maçã @ 1 unidade pequena')
      ],
      rc('suco-verde', 'omelete-legumes', 'crepioca', 'aveia-overnight', 'pudim-de-chia', 'sopa-legumes', 'frango-desfiado', 'almondegas-forno', 'legumes-assados', 'molho-limao', 'peixe-assado', 'carne-moida-legumes'),
      [
        K('Hortifruti', 'Folhas e legumes variados ajudam na saciedade', 'Alface @ 2 pés; Rúcula @ 2 maços; Tomate @ 1 kg; Tomate-cereja @ 1 bandeja; Pepino @ 3 unidades; Cenoura @ 600 g; Brócolis @ 2 maços; Abobrinha @ 4 unidades; Berinjela @ 1 unidade; Chuchu @ 2 unidades; Vagem @ 1 bandeja; Couve @ 1 maço; Quiabo @ 300 g; Repolho @ 1/2 unidade; Cebola @ 500 g; Alho @ 1 cabeça; Limão @ 6 unidades; Maçã @ 5 unidades; Pera @ 3 unidades; Morango @ 2 bandejas; Mamão @ 1 unidade; Banana @ 4 unidades; Laranja @ 4 unidades; Melancia @ 1 fatia grande; Abacaxi @ 1 unidade pequena'),
        K('Proteínas', '', 'Peito de frango @ 1 kg; Sobrecoxa @ 300 g; Carne moída magra @ 500 g; Patinho em bifes @ 150 g; Tilápia @ 600 g; Ovos @ 2 dúzias; Atum ao natural @ 1 lata'),
        K('Grãos e cereais', '', 'Arroz integral @ 300 g; Feijão carioca @ 300 g; Lentilha @ 150 g; Grão-de-bico @ 200 g; Aveia em flocos @ 1 pacote; Chia @ 1 pacote pequeno; Granola sem açúcar @ 1 pacote pequeno; Flocão de milho @ 1 pacote pequeno'),
        K('Laticínios', '', 'Iogurte natural @ 10 potes; Queijo minas frescal @ 300 g; Ricota @ 1 unidade; Leite @ 500 ml'),
        K('Mercearia e padaria', '', 'Pão integral @ 1 pacote; Tapioca (goma) @ 1 pacote; Castanhas e amêndoas @ 1 pacote pequeno; Milho de pipoca @ 1 pacote; Azeite @ 1 vidro; Café e chás @ a gosto')
      ]);
  })();

  // =============== 3. GANHO DE MASSA ===============
  (function () {
    var A = 'Pão integral @ 2 fatias + Pasta de amendoim @ 1 colher de sopa + Banana @ 1 unidade';
    var B = 'Iogurte natural @ 1 pote (170 g) + Granola @ 3 colheres de sopa + Mamão @ 1 fatia média';
    var C = 'Vitamina de banana @ 1 copo (400 ml) #vitamina-banana + Aveia em flocos @ 2 colheres de sopa + Castanha-de-caju @ 5 unidades';
    var PA = 'Pão integral @ 2 fatias + Peito de peru @ 3 fatias + Queijo minas frescal @ 1 fatia + Banana @ 1 unidade';
    var PB = 'Tapioca @ 4 colheres de sopa + Ovo mexido @ 2 unidades + Suco de laranja natural @ 1 copo';
    var PC = 'Iogurte natural @ 1 pote (170 g) + Aveia em flocos @ 2 colheres de sopa + Banana @ 1 unidade + Pasta de amendoim @ 1 colher de sobremesa';
    var PD = 'Bolo de banana @ 2 fatias #bolo-de-banana + Leite @ 1 copo (200 ml)';
    var AR = 'Arroz @ 5 colheres de sopa #arroz-soltinho';
    var FE = 'Feijão carioca @ 1 concha cheia';
    M('ganho-massa', 'Ganho de massa', 'Mais energia e proteína, distribuídas em 6 refeições', 'individual',
      [
        G('Não pule refeições', 'Os seis horários ajudam a alcançar a energia que o plano pede ao longo do dia.', 'u'),
        G('Proteína em todas as refeições', 'Ovos, carnes, frango, peixe, leite, iogurte e leguminosas.'),
        G('Carboidrato antes do treino', 'Fruta, pão ou tapioca cerca de 1 a 2 horas antes do treino ajudam no desempenho.'),
        G('Beba água ao longo do dia', 'Aumente a quantidade nos dias de treino.'),
        G('Fracione se sentir muito volume', 'Divida a refeição em duas partes e avise a nutricionista.')
      ],
      [
        R('cafe', '07:00', '', 'Café da manhã', '', [
          'Pão integral @ 3 fatias + Ovo mexido @ 3 unidades + Queijo minas frescal @ 2 fatias + Banana @ 1 unidade + Leite @ 1 copo (200 ml) // Mingau de aveia @ 1 tigela grande #mingau-aveia + Pasta de amendoim @ 1 colher de sopa + Banana @ 1 unidade',
          'Tapioca @ 5 colheres de sopa + Ovo mexido @ 3 unidades + Queijo minas frescal @ 2 fatias + Mamão @ 1 fatia média + Leite @ 1 copo (200 ml) // Panqueca de banana @ 3 unidades #panqueca-banana + Pasta de amendoim @ 1 colher de sopa + Café com leite @ 1 xícara',
          'Cuscuz @ 2 fatias + Ovo mexido @ 3 unidades + Frango desfiado @ 3 colheres de sopa #frango-desfiado + Banana @ 1 unidade // Pão integral @ 2 fatias + Queijo minas frescal @ 2 fatias + Vitamina de banana @ 1 copo (400 ml) #vitamina-banana + Aveia em flocos @ 3 colheres de sopa',
          'Pão integral @ 3 fatias + Peito de peru @ 3 fatias + Queijo minas frescal @ 2 fatias + Ovo cozido @ 2 unidades + Laranja @ 1 unidade // Iogurte natural @ 2 potes (340 g) + Granola @ 4 colheres de sopa + Banana @ 1 unidade + Castanha-do-pará @ 2 unidades',
          'Omelete de legumes @ 3 ovos #omelete-legumes + Pão integral @ 2 fatias + Mamão @ 1 fatia média + Leite @ 1 copo (200 ml) // Tapioca @ 5 colheres de sopa + Frango desfiado @ 3 colheres de sopa #frango-desfiado + Queijo minas frescal @ 1 fatia + Suco de laranja natural @ 1 copo',
          'Panqueca de banana @ 3 unidades #panqueca-banana + Iogurte natural @ 1 pote (170 g) + Morango @ 5 unidades // Bolo de banana @ 2 fatias #bolo-de-banana + Ovo mexido @ 2 unidades + Leite @ 1 copo (200 ml)',
          'Cuscuz @ 2 fatias + Ovo mexido @ 3 unidades + Queijo coalho @ 1 espeto + Suco de laranja natural @ 1 copo // Pão integral @ 3 fatias + Queijo minas frescal @ 2 fatias + Presunto magro @ 2 fatias + Vitamina de banana @ 1 copo (400 ml) #vitamina-banana'
        ]),
        R('lanche-manha', '10:00', '', 'Lanche da manhã', '', [
          A + ' // ' + B, B + ' // ' + C, C + ' // ' + A, A + ' // ' + C, B + ' // ' + A, C + ' // ' + B, A + ' // ' + B
        ]),
        R('almoco', '12:30', '', 'Almoço', '', [
          AR + ' + ' + FE + ' + Frango grelhado @ 1 filé grande + Legumes refogados @ 3 colheres de sopa + Salada de alface e tomate @ à vontade // Macarrão @ 2 pegadores + Carne moída com legumes @ 4 colheres de sopa #carne-moida-legumes + Salada de folhas @ à vontade + Queijo ralado @ 1 colher de sopa',
          AR + ' + ' + FE + ' + Patinho grelhado @ 1 bife grande + Batata-doce cozida @ 1 unidade média + Salada de folhas @ à vontade // Escondidinho de batata-doce com frango @ 1 porção grande #escondidinho-batata-doce + Arroz @ 3 colheres de sopa + Salada de folhas @ à vontade',
          AR + ' + ' + FE + ' + Tilápia grelhada @ 1 filé grande + Purê de mandioquinha @ 3 colheres de sopa + Brócolis cozido @ 3 colheres de sopa // ' + AR + ' + Lentilha cozida @ 1 concha cheia + Almôndegas assadas @ 5 unidades #almondegas-forno + Salada de repolho e cenoura @ à vontade',
          AR + ' + ' + FE + ' + Frango desfiado @ 5 colheres de sopa #frango-desfiado + Mandioca cozida @ 2 pedaços + Couve refogada @ 3 colheres de sopa // Macarrão @ 2 pegadores + Frango desfiado @ 5 colheres de sopa #frango-desfiado + Molho de tomate @ 3 colheres de sopa + Salada de folhas @ à vontade',
          AR + ' + ' + FE + ' + Carne de panela @ 1 pedaço médio + Abóbora refogada @ 3 colheres de sopa + Salada de folhas @ à vontade // ' + AR + ' + ' + FE + ' + Sobrecoxa assada sem pele @ 2 unidades + Batata-doce assada @ 1 unidade + Salada de alface @ à vontade',
          AR + ' + ' + FE + ' + Carne moída com legumes @ 4 colheres de sopa #carne-moida-legumes + Ovo cozido @ 1 unidade + Salada de folhas @ à vontade // ' + AR + ' + Lentilha cozida @ 1 concha cheia + Frango grelhado @ 1 filé grande + Cenoura cozida @ 3 colheres de sopa',
          'Refeição livre @ aproveite com atenção e mantenha o jantar do plano !l // ' + AR + ' + ' + FE + ' + Frango assado @ 1 coxa e 1 sobrecoxa + Batata assada @ 2 unidades + Salada de folhas @ à vontade'
        ]),
        R('lanche-tarde', '16:00', '', 'Lanche da tarde', '', [
          PA + ' // ' + PB, PB + ' // ' + PC, PC + ' // ' + PD, PD + ' // ' + PA, PA + ' // ' + PC, PB + ' // ' + PD, PC + ' // ' + PA
        ]),
        R('jantar', '19:30', '', 'Jantar', '', [
          'Arroz @ 4 colheres de sopa #arroz-soltinho + Feijão carioca @ 1 concha + Carne moída com legumes @ 4 colheres de sopa #carne-moida-legumes + Salada de folhas @ à vontade // Omelete de legumes @ 3 ovos #omelete-legumes + Pão integral @ 2 fatias + Salada de folhas @ à vontade',
          'Macarrão @ 2 pegadores + Frango desfiado @ 4 colheres de sopa #frango-desfiado + Brócolis cozido @ 3 colheres de sopa // Escondidinho de batata-doce com frango @ 1 porção #escondidinho-batata-doce + Salada de folhas @ à vontade',
          'Arroz @ 4 colheres de sopa #arroz-soltinho + Feijão carioca @ 1 concha + Almôndegas assadas @ 5 unidades #almondegas-forno + Legumes refogados @ 3 colheres de sopa // Tapioca @ 4 colheres de sopa + Ovo mexido @ 3 unidades + Queijo minas frescal @ 2 fatias + Salada de folhas @ à vontade',
          'Arroz @ 4 colheres de sopa #arroz-soltinho + Tilápia grelhada @ 1 filé grande + Purê de batata-doce @ 3 colheres de sopa + Salada de folhas @ à vontade // Pão integral @ 3 fatias + Frango desfiado @ 4 colheres de sopa #frango-desfiado + Queijo minas frescal @ 1 fatia + Alface e tomate @ à vontade',
          'Omelete de legumes @ 3 ovos #omelete-legumes + Arroz @ 3 colheres de sopa + Salada de folhas @ à vontade // Sopa de legumes com carne @ 1 prato fundo + Pão integral @ 2 fatias',
          'Arroz @ 4 colheres de sopa #arroz-soltinho + Feijão carioca @ 1 concha + Frango grelhado @ 1 filé grande + Abobrinha refogada @ 3 colheres de sopa // Escondidinho de batata-doce com frango @ 1 porção #escondidinho-batata-doce + Salada de folhas @ à vontade',
          'Pão integral @ 3 fatias + Ovo mexido @ 3 unidades + Queijo minas frescal @ 2 fatias + Suco de laranja natural @ 1 copo // Macarrão @ 2 pegadores + Carne moída com legumes @ 4 colheres de sopa #carne-moida-legumes'
        ]),
        R('ceia', '22:00', '', 'Ceia', '', 'Iogurte natural @ 1 pote (170 g) + Aveia em flocos @ 1 colher de sopa // Leite morno @ 1 copo (200 ml) + Banana @ 1 unidade')
      ],
      rc('vitamina-banana', 'panqueca-banana', 'omelete-legumes', 'mingau-aveia', 'frango-desfiado', 'carne-moida-legumes', 'almondegas-forno', 'escondidinho-batata-doce', 'bolo-de-banana', 'arroz-soltinho'),
      [
        K('Hortifruti', 'Compras para uma pessoa, uma semana', 'Banana @ 2 dúzias; Mamão @ 2 unidades; Laranja @ 8 unidades; Morango @ 1 bandeja; Batata-doce @ 1,5 kg; Mandioca @ 500 g; Batata inglesa @ 500 g; Mandioquinha @ 400 g; Abóbora @ 400 g; Tomate @ 1 kg; Alface @ 2 pés; Brócolis @ 2 maços; Cenoura @ 600 g; Abobrinha @ 3 unidades; Couve @ 1 maço; Repolho @ 1/2 unidade; Cebola @ 600 g; Alho @ 2 cabeças'),
        K('Proteínas', '', 'Peito de frango @ 1,5 kg; Sobrecoxa e coxa @ 800 g; Carne moída magra @ 1 kg; Patinho em bifes @ 300 g; Carne para panela @ 400 g; Tilápia @ 600 g; Ovos @ 3 dúzias; Peito de peru fatiado @ 300 g; Presunto magro @ 100 g'),
        K('Grãos e massas', '', 'Arroz @ 1 kg; Feijão carioca @ 500 g; Lentilha @ 250 g; Macarrão @ 500 g; Aveia em flocos @ 500 g; Granola @ 1 pacote; Farinha de arroz @ 1 pacote; Flocão de milho @ 1 pacote'),
        K('Laticínios', '', 'Leite @ 3 litros; Iogurte natural @ 12 potes; Queijo minas frescal @ 500 g; Queijo coalho @ 1 espeto; Queijo ralado @ 1 pacote pequeno'),
        K('Mercearia e padaria', '', 'Pão integral @ 2 pacotes; Tapioca (goma) @ 2 pacotes; Pasta de amendoim @ 1 pote; Castanhas (caju e pará) @ 1 pacote; Molho de tomate @ 2 caixas; Fermento em pó @ 1 lata; Óleo e azeite @ 1 de cada')
      ]);
  })();

  // =============== 4. LOW CARB ===============
  (function () {
    var A = 'Castanhas mistas @ 1 punhado (30 g) + Morango @ 5 unidades';
    var B = 'Iogurte natural sem açúcar @ 1 pote (170 g) + Chia @ 1 colher de chá';
    var C = 'Ovo cozido @ 1 unidade + Queijo minas frescal @ 1 fatia';
    var D = 'Creme de abacate @ 1 porção #creme-abacate';
    var SF = 'Salada de folhas, tomate e pepino @ à vontade + Molho de limão @ 1 colher de sopa #molho-limao';
    var AC = 'Arroz de couve-flor @ 4 colheres de sopa #arroz-couve-flor';
    var PU = 'Purê de couve-flor @ 4 colheres de sopa #pure-couve-flor';
    M('low-carb', 'Low carb', 'Menos carboidrato, mais proteína e gorduras boas', 'individual',
      [
        G('Proteína em todas as refeições', 'Ovos, carnes, frango, peixes e queijos entram em cada refeição.', 'u'),
        G('Troque o carboidrato por legumes', 'Couve-flor, abobrinha, berinjela e folhas ocupam o lugar de parte do arroz, da massa e do pão.'),
        G('Inclua gorduras boas', 'Azeite, abacate, castanhas e sementes, nas quantidades do plano.'),
        G('Leia os rótulos', 'Muitos industrializados trazem açúcar e farinhas escondidos.'),
        G('Beba água ao longo do dia', 'Chás e café sem açúcar também contam.')
      ],
      [
        R('cafe', '07:00', '', 'Café da manhã', '', [
          'Omelete de legumes @ 3 ovos #omelete-legumes + Queijo minas frescal @ 1 fatia + Café sem açúcar @ 1 xícara pequena // Iogurte natural sem açúcar @ 1 pote (170 g) + Chia @ 1 colher de sopa + Morango @ 5 unidades + Castanhas @ 4 unidades',
          'Muffin de ovo @ 2 unidades #muffin-de-ovo + Abacate @ 3 colheres de sopa + Café sem açúcar @ 1 xícara pequena // Ovo mexido @ 2 unidades + Queijo coalho @ 1 espeto + Tomate @ 4 rodelas',
          'Ovo mexido com tomate @ 3 unidades + Abacate @ 2 colheres de sopa // Iogurte natural sem açúcar @ 1 pote (170 g) + Coco ralado sem açúcar @ 1 colher de sopa + Nozes @ 3 unidades',
          'Omelete de queijo e orégano @ 2 ovos + Tomate-cereja @ 6 unidades + Café com leite sem açúcar @ 1 xícara // Peito de peru @ 3 fatias + Queijo minas frescal @ 2 fatias + Ovo cozido @ 1 unidade',
          'Muffin de ovo @ 2 unidades #muffin-de-ovo + Queijo minas frescal @ 1 fatia + Café sem açúcar @ 1 xícara pequena // Creme de abacate @ 1 porção #creme-abacate + Castanhas @ 4 unidades',
          'Peito de peru @ 3 fatias + Queijo minas frescal @ 2 fatias + Ovo cozido @ 2 unidades + Pepino @ 1/2 unidade // Omelete de legumes @ 2 ovos #omelete-legumes + Abacate @ 2 colheres de sopa',
          'Omelete de legumes @ 3 ovos #omelete-legumes + Abacate @ 2 colheres de sopa + Café sem açúcar @ 1 xícara pequena // Iogurte natural sem açúcar @ 1 pote (170 g) + Nozes @ 3 unidades + Morango @ 5 unidades'
        ]),
        R('lanche-manha', '10:00', '', 'Lanche da manhã', '', [
          A + ' // ' + C, B + ' // ' + A, C + ' // ' + D, D + ' // ' + B, A + ' // ' + D, B + ' // ' + C, C + ' // ' + A
        ]),
        R('almoco', '12:30', '', 'Almoço', '', [
          'Frango grelhado @ 1 filé médio + ' + AC + ' + Brócolis refogado @ 4 colheres de sopa + ' + SF + ' // Almôndegas assadas @ 5 unidades #almondegas-forno + ' + PU + ' + Salada de rúcula @ à vontade',
          'Tilápia grelhada @ 1 filé grande + Legumes assados @ 1 prato de sobremesa #legumes-assados + ' + AC + ' // Carne moída refogada @ 4 colheres de sopa + Abobrinha refogada @ 4 colheres de sopa + Ovo cozido @ 1 unidade + ' + SF,
          'Frango desfiado @ 4 colheres de sopa #frango-desfiado + ' + PU + ' + Couve refogada @ 3 colheres de sopa + ' + SF + ' // Patinho grelhado @ 1 bife grande + Berinjela grelhada @ 4 fatias + ' + AC + ' + Salada de folhas @ à vontade',
          'Omelete assada de legumes @ 1 fatia grande #frittata-forno + Abacate @ 3 colheres de sopa + ' + SF + ' // Sobrecoxa assada sem pele @ 1 unidade + Legumes assados @ 1 prato de sobremesa #legumes-assados + ' + AC,
          'Tilápia assada com limão @ 1 filé grande + Brócolis e cenoura cozidos @ 1 prato de sobremesa + Azeite @ 1 colher de chá // Bife acebolado @ 1 bife médio + Abobrinha refogada @ 4 colheres de sopa + Feijão carioca @ 2 colheres de sopa + Salada de folhas @ à vontade',
          'Salada de folhas, tomate e pepino @ 1 prato grande + Frango desfiado @ 4 colheres de sopa #frango-desfiado + Ovo cozido @ 1 unidade + Abacate @ 3 colheres de sopa + Molho de limão @ 1 colher de sopa #molho-limao // Almôndegas assadas @ 5 unidades #almondegas-forno + Legumes assados @ 1 prato de sobremesa #legumes-assados + Salada de folhas @ à vontade',
          'Refeição livre @ aproveite com atenção, sem exageros !l // Frango assado sem pele @ 1 coxa + ' + PU + ' + ' + SF
        ]),
        R('lanche-tarde', '16:00', '', 'Lanche da tarde', '', [
          'Queijo minas frescal @ 2 fatias + Tomate-cereja @ 6 unidades // Ovo cozido @ 2 unidades',
          'Iogurte natural sem açúcar @ 1 pote (170 g) + Nozes @ 3 unidades // Muffin de ovo @ 1 unidade #muffin-de-ovo',
          'Castanhas mistas @ 1 punhado (30 g) + Morango @ 5 unidades // Creme de abacate @ 1 porção #creme-abacate',
          'Peito de peru @ 3 fatias + Queijo minas frescal @ 1 fatia // Iogurte natural sem açúcar @ 1 pote (170 g) + Chia @ 1 colher de chá',
          'Ovo cozido @ 1 unidade + Palitos de pepino e cenoura @ 1 prato de sobremesa // Abacate @ 4 colheres de sopa + Limão @ a gosto',
          'Muffin de ovo @ 1 unidade #muffin-de-ovo + Café sem açúcar @ 1 xícara pequena // Queijo coalho @ 1 espeto',
          'Iogurte natural sem açúcar @ 1 pote (170 g) + Coco ralado sem açúcar @ 1 colher de sopa // Castanhas mistas @ 1 punhado (30 g)'
        ]),
        R('jantar', '19:30', '', 'Jantar', '', [
          'Omelete de legumes @ 3 ovos #omelete-legumes + Salada de folhas @ à vontade // Frango grelhado @ 1 filé médio + Legumes assados @ 1 prato de sobremesa #legumes-assados',
          'Muffin de ovo @ 3 unidades #muffin-de-ovo + Salada de folhas, tomate e pepino @ à vontade + Molho de limão @ 1 colher de sopa #molho-limao // Almôndegas assadas @ 5 unidades #almondegas-forno + ' + PU,
          'Omelete assada de legumes @ 1 fatia grande #frittata-forno + Salada de folhas @ à vontade // Tilápia grelhada @ 1 filé médio + Abobrinha refogada @ 4 colheres de sopa',
          'Frango desfiado @ 4 colheres de sopa #frango-desfiado + ' + AC + ' + Salada de folhas @ à vontade // Salada de folhas e tomate @ 1 prato grande + Atum ao natural @ 1/2 lata + Ovo cozido @ 1 unidade + Azeite @ 1 colher de sopa',
          'Omelete de queijo e orégano @ 3 ovos + Salada de folhas @ à vontade // Carne moída refogada @ 4 colheres de sopa + ' + PU,
          'Sobrecoxa assada sem pele @ 1 unidade + Legumes assados @ 1 prato de sobremesa #legumes-assados // Omelete de legumes @ 3 ovos #omelete-legumes + Abacate @ 3 colheres de sopa',
          'Frango grelhado @ 1 filé médio + Brócolis refogado @ 4 colheres de sopa + Salada de folhas @ à vontade // Muffin de ovo @ 3 unidades #muffin-de-ovo + Salada de folhas @ à vontade'
        ]),
        R('ceia', '21:30', '', 'Ceia', '', 'Iogurte natural sem açúcar @ 1 pote pequeno (120 g) // Queijo minas frescal @ 1 fatia + Chá sem açúcar @ 1 xícara')
      ],
      rc('omelete-legumes', 'muffin-de-ovo', 'frittata-forno', 'arroz-couve-flor', 'pure-couve-flor', 'almondegas-forno', 'frango-desfiado', 'creme-abacate', 'molho-limao', 'legumes-assados'),
      [
        K('Hortifruti', '', 'Couve-flor @ 2 unidades; Brócolis @ 2 maços; Abobrinha @ 4 unidades; Berinjela @ 2 unidades; Couve @ 1 maço; Alface e rúcula @ 3 maços; Tomate @ 800 g; Tomate-cereja @ 2 bandejas; Pepino @ 4 unidades; Cenoura @ 400 g; Abacate @ 4 unidades; Morango @ 2 bandejas; Banana @ 1 unidade; Limão @ 8 unidades; Cebola @ 400 g; Alho @ 2 cabeças; Espinafre @ 1 maço'),
        K('Proteínas', '', 'Ovos @ 3 dúzias; Peito de frango @ 1 kg; Sobrecoxa e coxa @ 500 g; Carne moída magra @ 800 g; Patinho @ 250 g; Bife para acebolar @ 150 g; Tilápia @ 600 g; Atum ao natural @ 1 lata; Peito de peru fatiado @ 200 g'),
        K('Laticínios', '', 'Queijo minas frescal @ 500 g; Queijo coalho @ 2 espetos; Queijo orégano ou muçarela @ 100 g; Iogurte natural sem açúcar @ 10 potes; Leite @ 1 litro'),
        K('Oleaginosas e sementes', '', 'Castanhas mistas @ 1 pacote; Nozes @ 1 pacote pequeno; Chia @ 1 pacote pequeno; Coco ralado sem açúcar @ 1 pacote pequeno; Cacau em pó @ 1 pote pequeno'),
        K('Mercearia', 'Carboidratos em pequena quantidade', 'Azeite @ 1 vidro; Mostarda @ 1 pote; Feijão carioca @ 200 g; Orégano e ervas secas @ 1 pote; Café e chás @ a gosto')
      ]);
  })();

  // =============== 5. GESTANTE ===============
  (function () {
    var A = 'Banana @ 1 unidade + Aveia em flocos @ 1 colher de sopa';
    var B = 'Iogurte natural @ 1 pote (170 g) + Mamão @ 1 fatia pequena';
    var C = 'Torrada integral @ 2 unidades + Queijo minas pasteurizado @ 1 fatia + Maçã @ 1 unidade pequena';
    var LA = 'Iogurte natural @ 1 pote (170 g) + Banana @ 1 unidade';
    var LB = 'Pão integral @ 1 fatia + Queijo minas pasteurizado @ 1 fatia + Suco de laranja natural @ 1 copo pequeno';
    var LC = 'Bolo de banana @ 1 fatia #bolo-de-banana + Leite @ 1 copo (200 ml)';
    var LD = 'Vitamina de mamão @ 1 copo (300 ml) #vitamina-mamao + Torrada integral @ 2 unidades';
    var LE = 'Mingau de aveia @ 1 tigela pequena #mingau-aveia';
    var AR = 'Arroz @ 4 colheres de sopa';
    var FE = 'Feijão de casa @ 1 concha #feijao-de-casa';
    M('gestante', 'Gestante', 'Refeições frequentes e variadas para a gestação', 'individual',
      [
        G('Evite alimentos crus ou mal cozidos', 'Sem peixe cru (sushi, sashimi), carne malpassada, ovo com gema mole, leite e queijos não pasteurizados.', 'a'),
        G('Lave bem frutas e folhas', 'Higienize frutas, verduras e legumes antes de comer.'),
        G('Faça refeições pequenas e frequentes', 'Isso costuma ajudar no enjoo e na azia.'),
        G('Beba água ao longo do dia', 'Deixe uma garrafa por perto.'),
        G('Siga as orientações do pré-natal', 'Dúvidas sobre suplementos, exames ou sintomas devem ir para a equipe de saúde.', 'u')
      ],
      [
        R('acordar', '', 'Ao acordar', 'Primeiro lanche do dia', '', 'Biscoito de água e sal @ 2 unidades + Água @ 1 copo (200 ml) // Água @ 1 copo (200 ml)'),
        R('cafe', '07:30', '', 'Café da manhã', '', [
          'Pão integral @ 2 fatias + Ovo mexido bem cozido @ 2 unidades + Mamão @ 1 fatia média + Leite @ 1 copo (200 ml) // Mingau de aveia @ 1 tigela pequena #mingau-aveia + Banana @ 1 unidade',
          'Tapioca @ 3 colheres de sopa + Queijo minas pasteurizado @ 1 fatia + Laranja @ 1 unidade // Pão integral @ 2 fatias + Ricota pasteurizada @ 2 colheres de sopa + Morango @ 5 unidades',
          'Cuscuz @ 1 fatia + Ovo cozido com gema dura @ 2 unidades + Mamão @ 1 fatia média // Vitamina de mamão @ 1 copo (300 ml) #vitamina-mamao + Torrada integral @ 2 unidades + Queijo minas pasteurizado @ 1 fatia',
          'Omelete de legumes bem cozida @ 2 ovos #omelete-legumes + Pão integral @ 1 fatia + Laranja @ 1 unidade // Iogurte natural @ 1 pote (170 g) + Aveia em flocos @ 2 colheres de sopa + Banana @ 1 unidade',
          'Bolo de banana @ 2 fatias #bolo-de-banana + Leite @ 1 copo (200 ml) + Mamão @ 1 fatia média // Pão integral @ 2 fatias + Ricota pasteurizada @ 2 colheres de sopa + Suco de laranja natural @ 1 copo pequeno',
          'Cuscuz @ 1 fatia + Ovo mexido bem cozido @ 2 unidades + Queijo coalho assado @ 1 espeto // Mingau de aveia @ 1 tigela pequena #mingau-aveia + Maçã @ 1 unidade',
          'Tapioca @ 4 colheres de sopa + Ovo mexido bem cozido @ 2 unidades + Suco de laranja natural @ 1 copo pequeno // Pão integral @ 2 fatias + Queijo minas pasteurizado @ 1 fatia + Mamão @ 1 fatia média + Leite @ 1 copo (200 ml)'
        ]),
        R('lanche-manha', '09:30', '', 'Lanche da manhã', '', [
          A + ' // ' + B, B + ' // ' + C, C + ' // ' + A, A + ' // ' + C, B + ' // ' + A, C + ' // ' + B, A + ' // ' + B
        ]),
        R('almoco', '12:00', '', 'Almoço', '', [
          AR + ' + ' + FE + ' + Frango grelhado bem cozido @ 1 filé médio + Cenoura e vagem cozidas @ 4 colheres de sopa + Couve refogada @ 2 colheres de sopa // ' + AR + ' + Lentilha temperada @ 1 concha #lentilha-temperada + Carne moída bem cozida @ 3 colheres de sopa + Abobrinha refogada @ 3 colheres de sopa',
          AR + ' + ' + FE + ' + Carne de panela com legumes @ 1 porção #carne-panela + Couve refogada @ 2 colheres de sopa // Macarrão @ 1 pegador + Frango desfiado @ 4 colheres de sopa #frango-desfiado + Molho de tomate cozido @ 3 colheres de sopa + Brócolis cozido @ 3 colheres de sopa',
          AR + ' + ' + FE + ' + Tilápia assada bem cozida @ 1 filé médio + Purê de batata-doce @ 2 colheres de sopa + Brócolis cozido @ 3 colheres de sopa // Escondidinho de batata-doce com frango @ 1 porção #escondidinho-batata-doce + Espinafre refogado @ 2 colheres de sopa + Arroz @ 2 colheres de sopa',
          AR + ' + Lentilha temperada @ 1 concha #lentilha-temperada + Ovo cozido com gema dura @ 2 unidades + Chuchu refogado @ 3 colheres de sopa // ' + AR + ' + ' + FE + ' + Sobrecoxa assada sem pele @ 1 unidade + Abóbora refogada @ 3 colheres de sopa',
          AR + ' + ' + FE + ' + Frango desfiado @ 4 colheres de sopa #frango-desfiado + Vagem refogada @ 3 colheres de sopa + Couve refogada @ 2 colheres de sopa // ' + AR + ' + ' + FE + ' + Pescada cozida bem passada @ 1 filé médio + Legumes cozidos @ 4 colheres de sopa',
          AR + ' + ' + FE + ' + Carne de panela com legumes @ 1 porção #carne-panela + Quiabo refogado @ 3 colheres de sopa // Macarrão @ 1 pegador + Carne moída bem cozida @ 4 colheres de sopa + Molho de tomate cozido @ 3 colheres de sopa + Cenoura cozida @ 3 colheres de sopa',
          'Refeição livre @ prefira alimentos bem cozidos e frutas bem lavadas !l // ' + AR + ' + ' + FE + ' + Frango assado sem pele @ 1 coxa + Purê de abóbora @ 2 colheres de sopa + Legumes cozidos @ 3 colheres de sopa'
        ]),
        R('lanche-tarde', '15:30', '', 'Lanche da tarde', '', [
          LA + ' // ' + LB, LC + ' // ' + LD, LE + ' // ' + LA, LB + ' // ' + LC, LD + ' // ' + LE, LA + ' // ' + LC, LB + ' // ' + LD
        ]),
        R('jantar', '19:00', '', 'Jantar', '', [
          'Sopa de legumes com frango @ 1 prato fundo #sopa-legumes + Torrada integral @ 2 unidades // Omelete de legumes bem cozida @ 2 ovos #omelete-legumes + Arroz @ 3 colheres de sopa + Brócolis cozido @ 3 colheres de sopa',
          'Escondidinho de batata-doce com frango @ 1 porção #escondidinho-batata-doce + Couve refogada @ 2 colheres de sopa // Arroz @ 3 colheres de sopa + Lentilha temperada @ 1 concha #lentilha-temperada + Abobrinha refogada @ 3 colheres de sopa',
          'Frango desfiado @ 4 colheres de sopa #frango-desfiado + Purê de batata-doce @ 3 colheres de sopa + Legumes cozidos @ 3 colheres de sopa // Sopa de legumes com ovo cozido @ 1 prato fundo #sopa-legumes + Pão integral @ 1 fatia',
          'Arroz @ 3 colheres de sopa + Feijão de casa @ 1/2 concha #feijao-de-casa + Tilápia assada bem cozida @ 1 filé médio + Chuchu refogado @ 3 colheres de sopa // Omelete de legumes bem cozida @ 2 ovos #omelete-legumes + Pão integral @ 2 fatias',
          'Sopa de legumes @ 1 prato fundo #sopa-legumes + Queijo minas pasteurizado @ 1 fatia + Torrada integral @ 2 unidades // Carne de panela com legumes @ 1 porção #carne-panela + Arroz @ 2 colheres de sopa',
          'Macarrão @ 1 pegador + Frango desfiado @ 4 colheres de sopa #frango-desfiado + Molho de tomate cozido @ 3 colheres de sopa // Arroz @ 3 colheres de sopa + Lentilha temperada @ 1 concha #lentilha-temperada + Ovo cozido com gema dura @ 1 unidade + Couve refogada @ 2 colheres de sopa',
          'Tapioca @ 3 colheres de sopa + Ovo mexido bem cozido @ 2 unidades + Queijo minas pasteurizado @ 1 fatia // Sopa de legumes com frango @ 1 prato fundo #sopa-legumes + Pão integral @ 1 fatia'
        ]),
        R('ceia', '21:30', '', 'Ceia', '', 'Leite morno @ 1 copo (200 ml) + Biscoito integral @ 2 unidades // Iogurte natural @ 1 pote pequeno (120 g) + Banana @ 1 unidade')
      ],
      rc('vitamina-mamao', 'mingau-aveia', 'omelete-legumes', 'sopa-legumes', 'frango-desfiado', 'escondidinho-batata-doce', 'feijao-de-casa', 'lentilha-temperada', 'bolo-de-banana', 'carne-panela'),
      [
        K('Hortifruti', 'Frutas e verduras bem lavadas', 'Mamão @ 2 unidades; Banana @ 1 dúzia; Laranja @ 8 unidades; Maçã @ 4 unidades; Morango @ 1 bandeja; Cenoura @ 600 g; Vagem @ 1 bandeja; Brócolis @ 2 maços; Abobrinha @ 3 unidades; Chuchu @ 3 unidades; Abóbora @ 400 g; Quiabo @ 300 g; Couve @ 2 maços; Espinafre @ 1 maço; Batata-doce @ 1 kg; Batata @ 500 g; Tomate @ 1 kg; Cebola @ 500 g; Alho @ 2 cabeças; Limão @ 3 unidades'),
        K('Carnes e ovos', 'Todas devem ser bem cozidas', 'Peito de frango @ 1 kg; Sobrecoxa e coxa @ 500 g; Carne moída magra @ 500 g; Carne para panela @ 600 g; Tilápia @ 400 g; Pescada @ 200 g; Ovos @ 2 dúzias'),
        K('Grãos e massas', '', 'Arroz @ 500 g; Feijão carioca @ 500 g; Lentilha @ 250 g; Macarrão @ 250 g; Aveia em flocos @ 1 pacote; Farinha de arroz @ 1 pacote pequeno; Flocão de milho @ 1 pacote pequeno; Tapioca (goma) @ 1 pacote'),
        K('Laticínios', 'Somente pasteurizados', 'Leite @ 2 litros; Iogurte natural @ 8 potes; Queijo minas @ 300 g; Ricota @ 1 unidade; Queijo coalho @ 1 espeto'),
        K('Padaria e mercearia', '', 'Pão integral @ 1 pacote; Torrada integral @ 1 pacote; Biscoito de água e sal @ 1 pacote; Biscoito integral @ 1 pacote; Molho de tomate @ 1 caixa; Fermento em pó @ 1 lata; Óleo e azeite @ 1 de cada')
      ]);
  })();

  // =============== 6. VEGETARIANA ===============
  (function () {
    var A = 'Banana @ 1 unidade + Castanha-de-caju @ 5 unidades';
    var B = 'Iogurte natural @ 1 pote (170 g) + Mamão @ 1 fatia pequena';
    var C = 'Pão integral @ 1 fatia + Pasta de grão-de-bico @ 1 colher de sopa #pasta-grao-de-bico + Cenoura em palitos @ 1 unidade';
    var LA = 'Iogurte natural @ 1 pote (170 g) + Banana @ 1 unidade + Aveia em flocos @ 1 colher de sopa';
    var LB = 'Pão integral @ 1 fatia + Pasta de ricota com ervas @ 2 colheres de sopa #pasta-ricota';
    var LC = 'Castanhas mistas @ 1 punhado (30 g) + Maçã @ 1 unidade';
    var LD = 'Pasta de grão-de-bico @ 2 colheres de sopa #pasta-grao-de-bico + Palitos de cenoura e pepino @ 1 prato de sobremesa';
    var LE = 'Queijo minas frescal @ 2 fatias + Torrada integral @ 2 unidades';
    var LF = 'Ovo cozido @ 1 unidade + Laranja @ 1 unidade';
    var AR = 'Arroz integral @ 3 colheres de sopa';
    var FE = 'Feijão de casa @ 1 concha #feijao-de-casa';
    var SF = 'Salada de folhas e tomate @ à vontade';
    M('vegetariana', 'Vegetariana', 'Sem carnes, com ovos e laticínios', 'individual',
      [
        G('Varie as fontes de proteína', 'Ovos, laticínios, feijão, lentilha, grão-de-bico, tofu e soja se alternam ao longo da semana.', 'u'),
        G('Combine arroz e leguminosas', 'Arroz com feijão ou lentilha forma uma dupla completa e barata.'),
        G('Inclua folhas verde-escuras', 'Couve, brócolis e espinafre entram no almoço e no jantar.'),
        G('Cozinhe leguminosas em quantidade', 'Faça feijão e lentilha de uma vez e congele em porções.'),
        G('Acompanhe com a nutricionista', 'Combine exames de rotina para acompanhar ferro e vitamina B12.')
      ],
      [
        R('cafe', '07:00', '', 'Café da manhã', '', [
          'Pão integral @ 2 fatias + Ovo mexido @ 2 unidades + Queijo minas frescal @ 1 fatia + Mamão @ 1 fatia média // Iogurte natural @ 1 pote (170 g) + Granola @ 2 colheres de sopa + Banana @ 1 unidade',
          'Crepioca @ 1 unidade #crepioca + Queijo minas frescal @ 1 fatia + Laranja @ 1 unidade // Pão integral @ 2 fatias + Pasta de grão-de-bico @ 2 colheres de sopa #pasta-grao-de-bico + Tomate @ 4 rodelas',
          'Omelete de legumes @ 2 ovos #omelete-legumes + Pão integral @ 1 fatia + Melancia @ 1 fatia média // Iogurte natural @ 1 pote (170 g) + Aveia em flocos @ 2 colheres de sopa + Morango @ 5 unidades',
          'Cuscuz @ 1 fatia + Ovo mexido @ 2 unidades + Queijo coalho @ 1 espeto // Pão integral @ 2 fatias + Pasta de amendoim @ 1 colher de sopa + Banana @ 1 unidade',
          'Tapioca @ 3 colheres de sopa + Queijo minas frescal @ 1 fatia + Ovo cozido @ 1 unidade + Suco de laranja natural @ 1 copo pequeno // Pão integral @ 2 fatias + Pasta de ricota com ervas @ 2 colheres de sopa #pasta-ricota + Morango @ 5 unidades',
          'Crepioca @ 1 unidade #crepioca + Ricota @ 2 colheres de sopa + Mamão @ 1 fatia média // Omelete de legumes @ 2 ovos #omelete-legumes + Torrada integral @ 2 unidades',
          'Pão integral @ 2 fatias + Ovo mexido @ 2 unidades + Queijo minas frescal @ 1 fatia + Café com leite @ 1 xícara // Iogurte natural @ 1 pote (170 g) + Granola @ 2 colheres de sopa + Maçã @ 1 unidade'
        ]),
        R('lanche-manha', '10:00', '', 'Lanche da manhã', '', [
          A + ' // ' + B, B + ' // ' + C, C + ' // ' + A, A + ' // ' + C, B + ' // ' + A, C + ' // ' + B, A + ' // ' + B
        ]),
        R('almoco', '12:30', '', 'Almoço', '', [
          AR + ' + ' + FE + ' + Hambúrguer de lentilha @ 2 unidades #hamburguer-lentilha + Brócolis cozido @ 3 colheres de sopa + ' + SF + ' // ' + AR + ' + ' + FE + ' + Omelete assada de legumes @ 1 fatia grande #frittata-forno + ' + SF,
          AR + ' + Lentilha temperada @ 1 concha #lentilha-temperada + Ovo cozido @ 2 unidades + Couve refogada @ 2 colheres de sopa + ' + SF + ' // Soja refogada @ 4 colheres de sopa #soja-refogada + ' + AR + ' + ' + FE + ' + Abobrinha refogada @ 3 colheres de sopa',
          'Escondidinho de lentilha @ 1 porção #escondidinho-lentilha + Arroz integral @ 2 colheres de sopa + ' + SF + ' // Macarrão integral @ 1 pegador + Molho de tomate @ 3 colheres de sopa + Tofu grelhado @ 1 fatia (100 g) + Brócolis cozido @ 3 colheres de sopa',
          AR + ' + ' + FE + ' + Tofu grelhado @ 1 fatia (100 g) + Couve refogada @ 2 colheres de sopa + ' + SF + ' // Salada de grão-de-bico @ 1 porção #salada-grao-de-bico + ' + AR + ' + Ovo cozido @ 1 unidade + Cenoura ralada @ 2 colheres de sopa',
          'Hambúrguer de lentilha @ 2 unidades #hamburguer-lentilha + Batata-doce assada @ 1 unidade + ' + SF + ' // Omelete assada de legumes @ 1 fatia grande #frittata-forno + ' + AR + ' + ' + FE + ' + Abobrinha refogada @ 3 colheres de sopa',
          'Soja refogada @ 4 colheres de sopa #soja-refogada + Purê de abóbora @ 3 colheres de sopa + ' + AR + ' + Couve refogada @ 2 colheres de sopa // ' + AR + ' + Lentilha temperada @ 1 concha #lentilha-temperada + Queijo minas grelhado @ 2 fatias + Legumes cozidos @ 3 colheres de sopa',
          'Refeição livre @ aproveite com atenção, sem exageros !l // ' + AR + ' + ' + FE + ' + Omelete de legumes @ 2 ovos #omelete-legumes + Batata assada @ 1 unidade + ' + SF
        ]),
        R('lanche-tarde', '16:00', '', 'Lanche da tarde', '', [
          LA + ' // ' + LB, LC + ' // ' + LD, LE + ' // ' + LF, LA + ' // ' + LD, LB + ' // ' + LC, LF + ' // ' + LE, LD + ' // ' + LA
        ]),
        R('jantar', '19:30', '', 'Jantar', '', [
          'Sopa de abóbora @ 1 prato fundo #sopa-abobora + Torrada integral @ 2 unidades + Queijo minas frescal @ 1 fatia // Omelete de legumes @ 2 ovos #omelete-legumes + Arroz integral @ 2 colheres de sopa + ' + SF,
          'Salada de grão-de-bico @ 1 porção #salada-grao-de-bico + Pão integral @ 1 fatia // Hambúrguer de lentilha @ 2 unidades #hamburguer-lentilha + Legumes cozidos @ 1 prato de sobremesa',
          'Tapioca @ 3 colheres de sopa + Queijo minas frescal @ 1 fatia + Ovo mexido @ 1 unidade + ' + SF + ' // Sopa de abóbora com ovo cozido @ 1 prato fundo #sopa-abobora',
          'Escondidinho de lentilha @ 1 porção pequena #escondidinho-lentilha + ' + SF + ' // Omelete assada de legumes @ 1 fatia grande #frittata-forno + Pão integral @ 1 fatia',
          'Soja refogada @ 4 colheres de sopa #soja-refogada + Arroz integral @ 2 colheres de sopa + Abobrinha refogada @ 3 colheres de sopa // Crepioca @ 1 unidade #crepioca + Ricota @ 2 colheres de sopa + ' + SF,
          'Sopa de abóbora @ 1 prato fundo #sopa-abobora + Pão integral @ 1 fatia // Lentilha temperada @ 1 concha #lentilha-temperada + Arroz integral @ 2 colheres de sopa + Couve refogada @ 2 colheres de sopa',
          'Pão integral @ 2 fatias + Queijo minas frescal @ 2 fatias + Tomate e alface @ à vontade + Suco de laranja natural @ 1 copo pequeno // Omelete de legumes @ 2 ovos #omelete-legumes + Salada de grão-de-bico @ 1/2 porção #salada-grao-de-bico'
        ]),
        R('ceia', '21:30', '', 'Ceia', '', 'Iogurte natural @ 1 pote pequeno (120 g) // Chá sem açúcar @ 1 xícara + Fruta @ 1 unidade pequena')
      ],
      rc('omelete-legumes', 'frittata-forno', 'crepioca', 'hamburguer-lentilha', 'lentilha-temperada', 'soja-refogada', 'escondidinho-lentilha', 'pasta-grao-de-bico', 'salada-grao-de-bico', 'sopa-abobora', 'pasta-ricota', 'feijao-de-casa'),
      [
        K('Hortifruti', '', 'Alface @ 2 pés; Tomate @ 1 kg; Pepino @ 2 unidades; Cenoura @ 600 g; Brócolis @ 2 maços; Abobrinha @ 3 unidades; Couve @ 2 maços; Espinafre @ 1 maço; Abóbora @ 800 g; Batata-doce @ 700 g; Batata @ 300 g; Cebola @ 600 g; Alho @ 2 cabeças; Limão @ 4 unidades; Banana @ 1 dúzia; Mamão @ 1 unidade; Maçã @ 3 unidades; Laranja @ 5 unidades; Morango @ 1 bandeja; Melancia @ 1 fatia'),
        K('Ovos e laticínios', '', 'Ovos @ 2 dúzias; Queijo minas frescal @ 500 g; Queijo coalho @ 1 espeto; Ricota @ 1 unidade; Iogurte natural @ 8 potes; Leite @ 1 litro'),
        K('Leguminosas e proteínas vegetais', '', 'Feijão carioca @ 500 g; Lentilha @ 500 g; Grão-de-bico @ 300 g; Tofu @ 2 blocos (200 g); Proteína texturizada de soja @ 1 pacote'),
        K('Grãos e padaria', '', 'Arroz integral @ 500 g; Macarrão integral @ 250 g; Aveia em flocos @ 1 pacote; Granola @ 1 pacote pequeno; Farinha de arroz @ 1 pacote pequeno; Flocão de milho @ 1 pacote pequeno; Tapioca (goma) @ 1 pacote; Pão integral @ 1 pacote; Torrada integral @ 1 pacote'),
        K('Mercearia', '', 'Molho de tomate @ 1 caixa; Pasta de amendoim @ 1 pote; Castanhas @ 1 pacote; Azeite @ 1 vidro; Cominho e ervas secas @ 1 pote; Café e chás @ a gosto')
      ]);
  })();

  // =============== 7. SEM GLÚTEN E SEM LACTOSE ===============
  (function () {
    var A = 'Banana @ 1 unidade + Castanha-de-caju @ 5 unidades';
    var B = 'Iogurte sem lactose @ 1 pote (170 g) + Mamão @ 1 fatia pequena';
    var C = 'Biscoito de arroz @ 3 unidades + Pasta de amendoim @ 1 colher de sobremesa';
    var LA = 'Iogurte sem lactose @ 1 pote (170 g) + Banana @ 1 unidade';
    var LB = 'Tapioca @ 3 colheres de sopa + Ovo mexido @ 1 unidade';
    var LC = 'Bolo de banana @ 1 fatia #bolo-de-banana + Café sem açúcar @ 1 xícara pequena';
    var LD = 'Maçã @ 1 unidade + Castanhas mistas @ 1 punhado (30 g)';
    var LE = 'Cuscuz @ 1 fatia #cuscuz-simples + Ovo cozido @ 1 unidade';
    var LF = 'Pipoca sem manteiga @ 2 xícaras + Laranja @ 1 unidade';
    var AR = 'Arroz @ 4 colheres de sopa';
    var FE = 'Feijão de casa @ 1 concha #feijao-de-casa';
    var SF = 'Salada de folhas e tomate @ à vontade';
    M('sem-gluten-lactose', 'Sem glúten/lactose', 'Para quem evita glúten e lactose, com opções simples', 'individual',
      [
        G('Leia os rótulos', 'Procure os avisos "contém glúten" e "contém leite" em molhos, embutidos, caldos e temperos prontos.', 'u'),
        G('Evite contaminação cruzada', 'Use utensílios, tábuas e frigideiras bem limpos ao preparar os alimentos.'),
        G('Prefira alimentos naturais', 'Arroz, feijão, mandioca, batata, carnes, ovos, frutas e legumes já são naturalmente sem glúten.'),
        G('Cuide das fontes de cálcio', 'Couve, brócolis, sardinha e bebidas vegetais enriquecidas entram na rotina.'),
        G('Beba água ao longo do dia', 'Deixe uma garrafa por perto.')
      ],
      [
        R('cafe', '07:00', '', 'Café da manhã', '', [
          'Tapioca @ 4 colheres de sopa + Ovo mexido @ 2 unidades + Mamão @ 1 fatia média + Café sem açúcar @ 1 xícara pequena // Pão sem glúten @ 2 fatias + Ovo mexido @ 2 unidades + Banana @ 1 unidade',
          'Crepioca @ 1 unidade #crepioca + Queijo sem lactose @ 1 fatia + Laranja @ 1 unidade // Cuscuz @ 1 fatia #cuscuz-simples + Ovo mexido @ 2 unidades + Mamão @ 1 fatia média',
          'Bolo de banana @ 2 fatias #bolo-de-banana + Leite sem lactose @ 1 copo (200 ml) + Ovo cozido @ 1 unidade // Iogurte sem lactose @ 1 pote (170 g) + Granola sem glúten @ 2 colheres de sopa + Morango @ 5 unidades',
          'Omelete de legumes @ 2 ovos #omelete-legumes + Mandioca cozida @ 2 pedaços pequenos + Laranja @ 1 unidade // Tapioca @ 3 colheres de sopa + Banana @ 1 unidade + Canela @ a gosto',
          'Cuscuz @ 1 fatia #cuscuz-simples + Ovo cozido @ 2 unidades + Suco de laranja natural @ 1 copo pequeno // Pão sem glúten @ 2 fatias + Pasta de amendoim @ 1 colher de sopa + Banana @ 1 unidade',
          'Crepioca @ 1 unidade #crepioca + Frango desfiado @ 2 colheres de sopa #frango-desfiado + Mamão @ 1 fatia média // Bolo de banana @ 2 fatias #bolo-de-banana + Café com leite sem lactose @ 1 xícara',
          'Tapioca @ 4 colheres de sopa + Ovo mexido @ 2 unidades + Suco de laranja natural @ 1 copo pequeno // Omelete assada @ 1 fatia #frittata-forno + Mamão @ 1 fatia média'
        ]),
        R('lanche-manha', '10:00', '', 'Lanche da manhã', '', [
          A + ' // ' + B, B + ' // ' + C, C + ' // ' + A, A + ' // ' + C, B + ' // ' + A, C + ' // ' + B, A + ' // ' + B
        ]),
        R('almoco', '12:30', '', 'Almoço', '', [
          AR + ' + ' + FE + ' + Frango grelhado @ 1 filé médio + Cenoura cozida @ 3 colheres de sopa + ' + SF + ' // ' + AR + ' + ' + FE + ' + Almôndegas assadas @ 4 unidades #almondegas-forno + Abobrinha refogada @ 3 colheres de sopa + ' + SF,
          'Peixe assado ao limão @ 1 filé médio #peixe-assado + Legumes assados @ 1 prato de sobremesa #legumes-assados + Arroz @ 3 colheres de sopa + Salada de folhas @ à vontade // ' + AR + ' + ' + FE + ' + Frango desfiado @ 4 colheres de sopa #frango-desfiado + Couve refogada @ 2 colheres de sopa + Purê de mandioquinha @ 2 colheres de sopa',
          AR + ' + ' + FE + ' + Patinho grelhado @ 1 bife médio + Mandioca cozida @ 2 pedaços + ' + SF + ' // Macarrão de arroz @ 1 pegador + Frango desfiado @ 4 colheres de sopa #frango-desfiado + Molho de tomate natural @ 3 colheres de sopa + Brócolis cozido @ 3 colheres de sopa',
          'Omelete assada @ 1 fatia grande #frittata-forno + ' + AR + ' + ' + FE + ' + ' + SF + ' // ' + AR + ' + ' + FE + ' + Sobrecoxa assada sem pele @ 1 unidade + Batata-doce cozida @ 1 unidade pequena + ' + SF,
          AR + ' + ' + FE + ' + Carne moída refogada @ 4 colheres de sopa + Chuchu refogado @ 3 colheres de sopa + ' + SF + ' // Tilápia grelhada @ 1 filé médio + ' + AR + ' + Purê de batata @ 2 colheres de sopa + Brócolis cozido @ 3 colheres de sopa',
          'Almôndegas assadas @ 5 unidades #almondegas-forno + ' + AR + ' + ' + FE + ' + Legumes assados @ 1 prato de sobremesa #legumes-assados // ' + AR + ' + ' + FE + ' + Frango assado sem pele @ 1 coxa + ' + SF,
          'Refeição livre @ aproveite com atenção, conferindo os ingredientes !l // ' + AR + ' + ' + FE + ' + Peixe assado ao limão @ 1 filé médio #peixe-assado + Legumes cozidos @ 3 colheres de sopa'
        ]),
        R('lanche-tarde', '16:00', '', 'Lanche da tarde', '', [
          LA + ' // ' + LB, LC + ' // ' + LD, LE + ' // ' + LF, LA + ' // ' + LD, LB + ' // ' + LC, LF + ' // ' + LE, LD + ' // ' + LA
        ]),
        R('jantar', '19:30', '', 'Jantar', '', [
          'Sopa de legumes com frango @ 1 prato fundo #sopa-legumes + Mandioca cozida @ 1 pedaço pequeno // Omelete de legumes @ 2 ovos #omelete-legumes + Arroz @ 2 colheres de sopa + Salada de folhas @ à vontade',
          'Tapioca @ 3 colheres de sopa + Frango desfiado @ 3 colheres de sopa #frango-desfiado + Salada de folhas @ à vontade // Tilápia grelhada @ 1 filé médio + Legumes assados @ 1 prato de sobremesa #legumes-assados',
          'Omelete assada @ 1 fatia grande #frittata-forno + Salada de folhas @ à vontade // Almôndegas assadas @ 4 unidades #almondegas-forno + Purê de batata-doce @ 3 colheres de sopa + Brócolis cozido @ 3 colheres de sopa',
          'Sopa de legumes @ 1 prato fundo #sopa-legumes + Ovo cozido @ 1 unidade // Arroz @ 3 colheres de sopa + Feijão de casa @ 1/2 concha #feijao-de-casa + Frango grelhado @ 1 filé pequeno + Abobrinha refogada @ 3 colheres de sopa',
          'Crepioca @ 1 unidade #crepioca + Ovo mexido @ 1 unidade + Salada de folhas @ à vontade // Peixe assado ao limão @ 1 filé médio #peixe-assado + Mandioca cozida @ 2 pedaços pequenos',
          'Omelete de legumes @ 2 ovos #omelete-legumes + Cuscuz @ 1 fatia pequena #cuscuz-simples // Sopa de legumes com frango @ 1 prato fundo #sopa-legumes',
          'Cuscuz @ 1 fatia #cuscuz-simples + Ovo mexido @ 2 unidades + Tomate @ 4 rodelas // Frango desfiado @ 4 colheres de sopa #frango-desfiado + Legumes assados @ 1 prato de sobremesa #legumes-assados'
        ]),
        R('ceia', '21:30', '', 'Ceia', '', 'Iogurte sem lactose @ 1 pote pequeno (120 g) // Chá sem açúcar @ 1 xícara + Banana @ 1 unidade pequena')
      ],
      rc('crepioca', 'bolo-de-banana', 'omelete-legumes', 'frittata-forno', 'cuscuz-simples', 'frango-desfiado', 'almondegas-forno', 'peixe-assado', 'legumes-assados', 'feijao-de-casa', 'sopa-legumes'),
      [
        K('Hortifruti', '', 'Alface @ 2 pés; Tomate @ 1 kg; Cenoura @ 600 g; Brócolis @ 2 maços; Abobrinha @ 4 unidades; Berinjela @ 1 unidade; Chuchu @ 2 unidades; Couve @ 1 maço; Espinafre @ 1 maço; Mandioca @ 1 kg; Mandioquinha @ 400 g; Batata @ 500 g; Batata-doce @ 500 g; Cebola @ 500 g; Alho @ 2 cabeças; Limão @ 5 unidades; Banana @ 1 dúzia; Mamão @ 2 unidades; Laranja @ 8 unidades; Maçã @ 3 unidades; Morango @ 1 bandeja'),
        K('Proteínas', '', 'Peito de frango @ 1 kg; Sobrecoxa e coxa @ 500 g; Carne moída magra @ 700 g; Patinho em bifes @ 150 g; Tilápia @ 800 g; Ovos @ 3 dúzias'),
        K('Grãos e farinhas sem glúten', 'Confira o selo "sem glúten" nas embalagens', 'Arroz @ 500 g; Feijão carioca @ 500 g; Macarrão de arroz @ 250 g; Farinha de arroz @ 1 pacote; Goma de tapioca @ 2 pacotes; Flocão de milho @ 1 pacote; Pão sem glúten @ 1 pacote; Biscoito de arroz @ 1 pacote; Granola sem glúten @ 1 pacote pequeno; Milho de pipoca @ 1 pacote'),
        K('Laticínios sem lactose', '', 'Leite sem lactose @ 1 litro; Iogurte sem lactose @ 8 potes; Queijo sem lactose @ 150 g'),
        K('Mercearia', '', 'Pasta de amendoim @ 1 pote; Castanhas mistas @ 1 pacote; Molho de tomate natural @ 1 caixa; Fermento em pó sem glúten @ 1 lata; Óleo e azeite @ 1 de cada; Café e chás @ a gosto')
      ]);
  })();

  // =============== 8. FAMÍLIA: ROTINA DA CASA ===============
  (function () {
    var A = 'Fruta da estação @ 1 unidade';
    var B = 'Iogurte natural @ 1 pote (170 g) + Banana @ 1 unidade';
    var C = 'Bolo de banana @ 1 fatia #bolo-de-banana';
    var D = 'Pão francês @ 1/2 unidade + Queijo minas @ 1 fatia';
    var LA = 'Bolo de banana @ 1 fatia #bolo-de-banana + Leite @ 1 copo (200 ml)';
    var LB = 'Pão francês @ 1 unidade + Queijo minas @ 1 fatia + Suco natural @ 1 copo pequeno';
    var LC = 'Cuscuz @ 1 fatia #cuscuz-simples + Ovo cozido @ 1 unidade';
    var LD = 'Iogurte natural @ 1 pote (170 g) + Fruta picada @ 1/2 xícara';
    var LE = 'Tapioca @ 3 colheres de sopa + Queijo minas @ 1 fatia';
    var LF = 'Pipoca sem manteiga @ 2 xícaras + Fruta @ 1 unidade';
    var AR = 'Arroz @ 4 colheres de sopa #arroz-soltinho';
    var FE = 'Feijão @ 1 concha #feijao-de-casa';
    var SF = 'Salada de alface e tomate @ à vontade';
    M('familia-casa', 'Rotina da casa', 'Cardápio de comida de casa para a família, com compras para 4', 'familia',
      [
        G('Quantidades por pessoa', 'As medidas valem para um adulto. Crianças comem porções menores, conforme a orientação da nutricionista.', 'a'),
        G('Planejem a semana juntos', 'Escolham um dia para as compras e outro para adiantar feijão, arroz e frango.'),
        G('Metade do prato de legumes e folhas', 'Cada um monta o seu prato com cores variadas.'),
        G('Comam à mesa, sem telas', 'A refeição em família ajuda a comer com mais atenção.'),
        G('Jarra de água na mesa', 'Deixe água à vista em todas as refeições.')
      ],
      [
        R('cafe', '07:00', '', 'Café da manhã', '', [
          'Pão francês @ 1 unidade + Ovo mexido @ 1 unidade + Queijo minas @ 1 fatia + Banana @ 1 unidade + Café com leite @ 1 xícara // Cuscuz @ 1 fatia #cuscuz-simples + Ovo cozido @ 1 unidade + Mamão @ 1 fatia média',
          'Tapioca @ 3 colheres de sopa + Queijo minas @ 1 fatia + Banana @ 1 unidade + Café com leite @ 1 xícara // Bolo de banana @ 2 fatias #bolo-de-banana + Leite @ 1 copo (200 ml) + Mamão @ 1 fatia média',
          'Pão francês @ 1 unidade + Requeijão @ 1 colher de sopa + Laranja @ 1 unidade + Café com leite @ 1 xícara // Iogurte natural @ 1 pote (170 g) + Aveia em flocos @ 2 colheres de sopa + Maçã @ 1 unidade',
          'Cuscuz @ 1 fatia #cuscuz-simples + Ovo mexido @ 1 unidade + Café com leite @ 1 xícara // Pão francês @ 1 unidade + Queijo minas @ 1 fatia + Presunto magro @ 1 fatia + Mamão @ 1 fatia média',
          'Tapioca @ 3 colheres de sopa + Ovo mexido @ 1 unidade + Laranja @ 1 unidade // Bolo de banana @ 2 fatias #bolo-de-banana + Café com leite @ 1 xícara + Maçã @ 1 unidade',
          'Pão francês @ 1 unidade + Ovo mexido @ 2 unidades + Queijo minas @ 1 fatia + Mamão @ 1 fatia média + Suco natural @ 1 copo pequeno // Cuscuz @ 1 fatia #cuscuz-simples + Ovo cozido @ 1 unidade + Banana @ 1 unidade',
          'Tapioca @ 4 colheres de sopa + Queijo minas @ 1 fatia + Fruta da estação @ 1 unidade + Café com leite @ 1 xícara // Pão francês @ 1 unidade + Queijo minas @ 1 fatia + Iogurte natural @ 1 pote (170 g)'
        ]),
        R('lanche-manha', '09:30', '', 'Lanche da manhã', '', [
          A + ' // ' + B, B + ' // ' + C, C + ' // ' + D, A + ' // ' + C, D + ' // ' + B, B + ' // ' + A, A + ' // ' + C
        ]),
        R('almoco', '12:00', '', 'Almoço', '', [
          AR + ' + ' + FE + ' + Frango assado @ 1 coxa ou sobrecoxa #frango-assado + Legumes assados @ 1 prato de sobremesa #legumes-assados + ' + SF + ' // Macarrão @ 2 pegadores + Molho de tomate caseiro @ 3 colheres de sopa #molho-tomate + Almôndegas assadas @ 3 unidades #almondegas-forno + ' + SF,
          AR + ' + ' + FE + ' + Carne de panela com legumes @ 1 porção #carne-panela + Salada de folhas @ à vontade // ' + AR + ' + ' + FE + ' + Frango ao molho de tomate @ 1 porção #frango-molho-tomate + Couve refogada @ 2 colheres de sopa + ' + SF,
          AR + ' + ' + FE + ' + Peixe assado ao limão @ 1 filé #peixe-assado + Legumes assados @ 1 prato de sobremesa #legumes-assados + ' + SF + ' // ' + AR + ' + ' + FE + ' + Almôndegas assadas @ 3 unidades #almondegas-forno + Purê de batata @ 2 colheres de sopa + ' + SF,
          AR + ' + ' + FE + ' + Frango ao molho de tomate @ 1 porção #frango-molho-tomate + Abobrinha refogada @ 3 colheres de sopa + ' + SF + ' // ' + AR + ' + ' + FE + ' + Carne moída refogada @ 3 colheres de sopa + Chuchu refogado @ 3 colheres de sopa + ' + SF,
          'Macarrão @ 2 pegadores + Molho de tomate caseiro @ 3 colheres de sopa #molho-tomate + Almôndegas assadas @ 3 unidades #almondegas-forno + ' + SF + ' // ' + AR + ' + ' + FE + ' + Frango assado @ 1 coxa ou sobrecoxa #frango-assado + Legumes assados @ 1 prato de sobremesa #legumes-assados',
          AR + ' + ' + FE + ' + Carne de panela com legumes @ 1 porção #carne-panela + ' + SF + ' // ' + AR + ' + ' + FE + ' + Bife grelhado @ 1 bife médio + Batata cozida @ 1 unidade + ' + SF,
          'Refeição livre @ aproveitem juntos, com atenção e sem exageros !l // ' + AR + ' + ' + FE + ' + Frango assado @ 1 coxa ou sobrecoxa #frango-assado + Maionese de legumes @ 2 colheres de sopa + ' + SF
        ]),
        R('lanche-tarde', '16:00', '', 'Lanche da tarde', '', [
          LA + ' // ' + LB, LB + ' // ' + LC, LC + ' // ' + LD, LD + ' // ' + LE, LE + ' // ' + LA, LF + ' // ' + LB, LA + ' // ' + LD
        ]),
        R('jantar', '19:00', '', 'Jantar', '', [
          'Sopa de legumes com frango @ 1 prato fundo #sopa-legumes + Pão francês @ 1/2 unidade // Cuscuz @ 1 fatia #cuscuz-simples + Ovo mexido @ 1 unidade + Queijo minas @ 1 fatia + Tomate @ 4 rodelas',
          'Arroz @ 3 colheres de sopa #arroz-soltinho + Feijão @ 1/2 concha #feijao-de-casa + Almôndegas assadas @ 3 unidades #almondegas-forno + ' + SF + ' // Tapioca @ 3 colheres de sopa + Queijo minas @ 1 fatia + Ovo cozido @ 1 unidade',
          'Sopa de legumes @ 1 prato fundo #sopa-legumes + Torrada @ 2 unidades // Frango ao molho de tomate @ 1 porção #frango-molho-tomate + Arroz @ 3 colheres de sopa #arroz-soltinho + Salada de folhas @ à vontade',
          'Cuscuz @ 1 fatia #cuscuz-simples + Ovo mexido @ 1 unidade + Banana @ 1 unidade // Peixe assado ao limão @ 1 filé #peixe-assado + Legumes assados @ 1 prato de sobremesa #legumes-assados',
          'Pão francês @ 1 unidade + Queijo minas @ 1 fatia + Presunto magro @ 1 fatia + Suco natural @ 1 copo pequeno // Sopa de legumes com ovo cozido @ 1 prato fundo #sopa-legumes',
          'Arroz @ 3 colheres de sopa #arroz-soltinho + Feijão @ 1/2 concha #feijao-de-casa + Ovo frito @ 1 unidade + Salada de folhas @ à vontade // Tapioca @ 3 colheres de sopa + Frango desfiado @ 2 colheres de sopa + Queijo minas @ 1 fatia',
          'Sopa de legumes com frango @ 1 prato fundo #sopa-legumes + Pão francês @ 1/2 unidade // Cuscuz @ 1 fatia #cuscuz-simples + Ovo cozido @ 1 unidade + Queijo minas @ 1 fatia'
        ]),
        R('ceia', '21:00', '', 'Ceia', '', 'Leite morno @ 1 copo (200 ml) + Biscoito integral @ 2 unidades // Fruta @ 1 unidade pequena')
      ],
      rc('feijao-de-casa', 'arroz-soltinho', 'frango-assado', 'carne-panela', 'frango-molho-tomate', 'almondegas-forno', 'sopa-legumes', 'peixe-assado', 'cuscuz-simples', 'molho-tomate', 'legumes-assados', 'bolo-de-banana'),
      [
        K('Hortifruti', 'Quantidades para 4 pessoas, uma semana', 'Alface @ 4 pés; Tomate @ 2 kg; Cenoura @ 1,5 kg; Abobrinha @ 6 unidades; Chuchu @ 4 unidades; Brócolis @ 3 maços; Berinjela @ 2 unidades; Couve @ 2 maços; Batata @ 2 kg; Cebola @ 1 kg; Alho @ 3 cabeças; Limão @ 10 unidades; Cheiro-verde @ 3 maços; Banana @ 3 dúzias; Mamão @ 3 unidades; Maçã @ 12 unidades; Laranja @ 15 unidades; Fruta da estação @ 12 unidades'),
        K('Carnes, peixes e ovos', '', 'Coxa e sobrecoxa de frango @ 2,5 kg; Peito de frango @ 1,5 kg; Carne para panela @ 1 kg; Carne moída magra @ 1,2 kg; Bife @ 500 g; Tilápia @ 1 kg; Ovos @ 4 dúzias; Presunto magro @ 200 g'),
        K('Arroz, feijão e massas', '', 'Arroz @ 2 kg; Feijão carioca @ 1 kg; Macarrão @ 1 kg; Flocão de milho @ 1 kg; Goma de tapioca @ 1 kg; Farinha de arroz @ 1 pacote; Aveia em flocos @ 1 pacote'),
        K('Laticínios e padaria', '', 'Leite @ 8 litros; Iogurte natural @ 16 potes; Queijo minas @ 1 kg; Requeijão @ 1 pote; Pão francês @ 20 unidades; Torrada @ 1 pacote; Biscoito integral @ 2 pacotes; Milho de pipoca @ 1 pacote'),
        K('Mercearia', '', 'Molho de tomate @ 2 caixas; Fermento em pó @ 1 lata; Azeite @ 1 vidro; Óleo @ 1 garrafa; Páprica e orégano @ 1 pote de cada; Café @ 1 pacote; Maionese @ 1 pote pequeno')
      ]);
  })();

  // =============== 9. FAMÍLIA: CASAL ===============
  (function () {
    var A = 'Maçã @ 1 unidade + Castanhas mistas @ 1 punhado (30 g)';
    var B = 'Iogurte natural @ 1 pote (170 g) + Banana @ 1 unidade';
    var C = 'Pão integral @ 1 fatia + Queijo minas @ 1 fatia + Chá sem açúcar @ 1 xícara';
    var D = 'Ovo cozido @ 1 unidade + Fruta @ 1 unidade';
    var LA = 'Iogurte natural @ 1 pote (170 g) + Granola @ 2 colheres de sopa';
    var LB = 'Pão integral @ 1 fatia + Queijo minas @ 1 fatia + Tomate @ 3 rodelas';
    var LC = 'Maçã @ 1 unidade + Castanhas mistas @ 1 punhado (30 g)';
    var LD = 'Tapioca @ 2 colheres de sopa + Ovo mexido @ 1 unidade';
    var LE = 'Ovo cozido @ 1 unidade + Banana @ 1 unidade';
    var AR = 'Arroz @ 4 colheres de sopa #arroz-soltinho';
    var FE = 'Feijão de casa @ 1 concha #feijao-de-casa';
    var SF = 'Salada de folhas e tomate @ à vontade';
    M('familia-casal', 'Casal', 'Cardápio para duas pessoas, com opções de marmita', 'familia',
      [
        G('Cozinhem as marmitas no domingo', 'Separe cerca de uma hora para fazer arroz, feijão, proteína e legumes dos dias de trabalho.', 'u'),
        G('Dividam o preparo', 'Um cozinha e o outro monta os potes. Fica mais rápido e organizado.'),
        G('Congelem em porções', 'Feijão, carne moída e almôndegas congelam bem. Passe para a geladeira na véspera.'),
        G('Quantidades por pessoa', 'As medidas valem para uma pessoa. Ajustes individuais ficam com a nutricionista.', 'a'),
        G('Levem água para o trabalho', 'Uma garrafa na bolsa ajuda a beber ao longo do dia.')
      ],
      [
        R('cafe', '07:00', '', 'Café da manhã', '', [
          'Pão integral @ 2 fatias + Ovo mexido @ 2 unidades + Mamão @ 1 fatia média + Café sem açúcar @ 1 xícara pequena // Aveia de geladeira @ 1 pote #aveia-overnight + Café sem açúcar @ 1 xícara pequena',
          'Tapioca @ 3 colheres de sopa + Queijo minas @ 1 fatia + Ovo cozido @ 1 unidade + Laranja @ 1 unidade // Iogurte natural @ 1 pote (170 g) + Granola @ 2 colheres de sopa + Banana @ 1 unidade',
          'Omelete de legumes @ 2 ovos #omelete-legumes + Pão integral @ 1 fatia + Melancia @ 1 fatia média // Aveia de geladeira @ 1 pote #aveia-overnight + Maçã @ 1 unidade',
          'Cuscuz @ 1 fatia + Ovo mexido @ 2 unidades + Queijo coalho @ 1 espeto // Pão integral @ 2 fatias + Queijo minas @ 2 fatias + Tomate @ 4 rodelas + Café sem açúcar @ 1 xícara pequena',
          'Aveia de geladeira @ 1 pote #aveia-overnight + Banana @ 1 unidade // Tapioca @ 3 colheres de sopa + Frango desfiado @ 2 colheres de sopa #frango-desfiado + Mamão @ 1 fatia média',
          'Omelete assada @ 1 fatia #frittata-forno + Pão integral @ 1 fatia + Suco de laranja natural @ 1 copo pequeno // Pão integral @ 2 fatias + Pasta de amendoim @ 1 colher de sopa + Banana @ 1 unidade + Café sem açúcar @ 1 xícara pequena',
          'Tapioca @ 4 colheres de sopa + Ovo mexido @ 2 unidades + Suco de laranja natural @ 1 copo pequeno // Iogurte natural @ 1 pote (170 g) + Granola @ 2 colheres de sopa + Fruta picada @ 1/2 xícara'
        ]),
        R('lanche-manha', '10:00', '', 'Lanche da manhã', '', [
          A + ' // ' + B, B + ' // ' + C, C + ' // ' + D, D + ' // ' + A, A + ' // ' + C, B + ' // ' + D, A + ' // ' + B
        ]),
        R('almoco', '12:30', '', 'Almoço', '', [
          AR + ' + ' + FE + ' + Frango desfiado (marmita) @ 4 colheres de sopa #frango-desfiado + Legumes assados @ 1 prato de sobremesa #legumes-assados // Salada de grão-de-bico (marmita) @ 1 porção #salada-grao-de-bico + Arroz @ 3 colheres de sopa #arroz-soltinho + Ovo cozido @ 1 unidade + Cenoura ralada @ 2 colheres de sopa',
          AR + ' + ' + FE + ' + Carne moída com legumes (marmita) @ 4 colheres de sopa #carne-moida-legumes + Brócolis cozido @ 3 colheres de sopa // ' + AR + ' + ' + FE + ' + Almôndegas assadas (marmita) @ 4 unidades #almondegas-forno + Cenoura e vagem cozidas @ 3 colheres de sopa',
          'Escondidinho de batata-doce (marmita) @ 1 porção #escondidinho-batata-doce + Salada de folhas em pote separado @ à vontade // ' + AR + ' + ' + FE + ' + Frango desfiado (marmita) @ 4 colheres de sopa #frango-desfiado + Abobrinha refogada @ 3 colheres de sopa',
          AR + ' + ' + FE + ' + Almôndegas assadas (marmita) @ 4 unidades #almondegas-forno + Legumes assados @ 1 prato de sobremesa #legumes-assados // Omelete assada (marmita) @ 1 fatia grande #frittata-forno + Arroz @ 3 colheres de sopa #arroz-soltinho + Feijão de casa @ 1/2 concha #feijao-de-casa + ' + SF,
          'Salada de grão-de-bico (marmita) @ 1 porção #salada-grao-de-bico + Frango desfiado @ 3 colheres de sopa #frango-desfiado + Arroz @ 3 colheres de sopa #arroz-soltinho // ' + AR + ' + ' + FE + ' + Carne moída com legumes (marmita) @ 4 colheres de sopa #carne-moida-legumes + ' + SF,
          AR + ' + ' + FE + ' + Tilápia grelhada @ 1 filé médio + Legumes assados @ 1 prato de sobremesa #legumes-assados + ' + SF + ' // Macarrão @ 2 pegadores + Frango desfiado @ 4 colheres de sopa #frango-desfiado + Brócolis cozido @ 3 colheres de sopa + Salada de folhas @ à vontade + Molho de limão @ 1 colher de sopa #molho-limao',
          'Refeição livre @ aproveitem o almoço com calma e sem exageros !l // ' + AR + ' + ' + FE + ' + Frango assado @ 1 coxa + Batata assada @ 1 unidade + ' + SF
        ]),
        R('lanche-tarde', '16:00', '', 'Lanche da tarde', '', [
          LA + ' // ' + LB, LB + ' // ' + LC, LC + ' // ' + LD, LD + ' // ' + LE, LE + ' // ' + LA, LA + ' // ' + LC, LB + ' // ' + LD
        ]),
        R('jantar', '19:30', '', 'Jantar', '', [
          'Omelete de legumes @ 2 ovos #omelete-legumes + ' + SF + ' + Arroz @ 2 colheres de sopa // Frango desfiado @ 3 colheres de sopa #frango-desfiado + Legumes assados @ 1 prato de sobremesa #legumes-assados',
          'Almôndegas assadas @ 3 unidades #almondegas-forno + Purê de batata-doce @ 3 colheres de sopa + Brócolis cozido @ 3 colheres de sopa // Pão integral @ 2 fatias + Frango desfiado @ 3 colheres de sopa #frango-desfiado + Alface e tomate @ à vontade',
          'Omelete assada @ 1 fatia grande #frittata-forno + Salada de folhas @ à vontade // Escondidinho de batata-doce @ 1 porção #escondidinho-batata-doce + Salada de folhas @ à vontade',
          'Salada de grão-de-bico @ 1 porção #salada-grao-de-bico + Ovo cozido @ 1 unidade // Tilápia grelhada @ 1 filé médio + Legumes assados @ 1 prato de sobremesa #legumes-assados',
          'Carne moída com legumes @ 4 colheres de sopa #carne-moida-legumes + Arroz @ 2 colheres de sopa #arroz-soltinho + ' + SF + ' // Tapioca @ 3 colheres de sopa + Queijo minas @ 1 fatia + Ovo mexido @ 1 unidade',
          'Pão integral @ 2 fatias + Queijo minas @ 2 fatias + Alface e tomate @ à vontade // Omelete de legumes @ 2 ovos #omelete-legumes + Pão integral @ 1 fatia',
          'Sopa de legumes com frango @ 1 prato fundo + Pão integral @ 1 fatia // Frango desfiado @ 3 colheres de sopa #frango-desfiado + Arroz @ 2 colheres de sopa #arroz-soltinho + ' + SF
        ]),
        R('ceia', '21:30', '', 'Ceia', '', 'Iogurte natural @ 1 pote pequeno (120 g) // Chá sem açúcar @ 1 xícara + Fruta @ 1 unidade pequena')
      ],
      rc('aveia-overnight', 'omelete-legumes', 'frango-desfiado', 'carne-moida-legumes', 'almondegas-forno', 'salada-grao-de-bico', 'frittata-forno', 'legumes-assados', 'molho-limao', 'arroz-soltinho', 'escondidinho-batata-doce', 'feijao-de-casa'),
      [
        K('Hortifruti', 'Quantidades para 2 pessoas, uma semana', 'Alface @ 2 pés; Tomate @ 1 kg; Cenoura @ 600 g; Brócolis @ 2 maços; Abobrinha @ 3 unidades; Berinjela @ 1 unidade; Vagem @ 1 bandeja; Pepino @ 2 unidades; Batata-doce @ 800 g; Batata @ 300 g; Espinafre @ 1 maço; Cebola @ 500 g; Alho @ 2 cabeças; Limão @ 5 unidades; Banana @ 1 dúzia; Maçã @ 8 unidades; Mamão @ 1 unidade; Laranja @ 8 unidades; Melancia @ 1 fatia grande'),
        K('Carnes e ovos', '', 'Peito de frango @ 1,5 kg; Coxa de frango @ 2 unidades; Carne moída magra @ 800 g; Tilápia @ 400 g; Ovos @ 3 dúzias'),
        K('Grãos e massas', '', 'Arroz @ 700 g; Feijão carioca @ 500 g; Grão-de-bico @ 300 g; Macarrão @ 250 g; Aveia em flocos @ 1 pacote; Granola @ 1 pacote; Flocão de milho @ 1 pacote pequeno; Goma de tapioca @ 1 pacote; Farinha de arroz @ 1 pacote pequeno'),
        K('Laticínios', '', 'Iogurte natural @ 14 potes; Queijo minas @ 500 g; Queijo coalho @ 1 espeto; Leite @ 1 litro'),
        K('Padaria e mercearia', 'Potes de vidro ajudam nas marmitas', 'Pão integral @ 2 pacotes; Pasta de amendoim @ 1 pote; Castanhas mistas @ 1 pacote; Azeite @ 1 vidro; Mostarda @ 1 pote pequeno; Café e chás @ a gosto')
      ]);
  })();

  window.TEMPLATES = T;
})();
