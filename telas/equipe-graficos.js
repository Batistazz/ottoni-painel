/* Equipe · visão geral em gráficos: metas do mês da casa, barbeiros lado a lado por indicador (com as faixas de
   mínimo e bônus propostas) e a evolução mês a mês de todos. Cor fixa por barbeiro, sempre com o nome escrito. */
Bancada.pronto(function (d) {
  var B = Bancada, rg = d.clientes_casa && d.clientes_casa.regua;
  // Paleta categórica validada no fundo escuro (azul, laranja, verde-água, amarelo); ordem fixa pelo cadastro.
  var CORES = ['#3987e5', '#d95926', '#199e70', '#c98500'], cor = {};
  d.barbeiros.forEach(function (b, i) { cor[b.barber_id] = CORES[i % CORES.length]; });
  function el(tag, css, txt) { var n = document.createElement(tag); if (css) n.style.cssText = css; if (txt != null) n.textContent = txt; return n; }
  function um(v) { return v == null ? '—' : v.toLocaleString('pt-BR', {maximumFractionDigits: 1}); }
  function horas(min) { return min == null ? '—' : um(min / 60) + ' h'; }

  // Indicadores: valor por barbeiro a partir de um bloco de estatística (período ou mês).
  var IND = [
    {k: 'ocup', t: 'Ocupação da cadeira', f: function (e) { var t = e && e.tempo_parado; return t && t.aberto_min ? t.atendendo_min / t.aberto_min * 100 : null; }, fmt: function (v) { return B.pct(v); },
      faixas: rg && [rg.minimo_pct, rg.bonus_pct], nota: 'atendendo ÷ horário aberto dele'},
    {k: 'prod', t: 'Produto por dia', f: function (e) { return e && e.dias_trabalhados && e.produto != null ? e.produto / e.dias_trabalhados : null; }, fmt: B.reais,
      faixas: rg && [rg.produto_dia_minimo, rg.produto_dia_bonus], nota: 'parte de cada um na meta da casa'},
    {k: 'atd', t: 'Atendimentos por dia', f: function (e) { return e && e.dias_trabalhados ? e.atendimentos / e.dias_trabalhados : null; }, fmt: um},
    {k: 'fat', t: 'Faturamento por dia', f: function (e) { return e && e.dias_trabalhados && e.total != null ? e.total / e.dias_trabalhados : null; }, fmt: B.reais, nota: 'serviços + produtos + assinaturas (estimativa)'},
    {k: 'parado', t: 'Tempo parado por dia', f: function (e) { var t = e && e.tempo_parado; return t && t.dias ? t.parado_min / t.dias : null; }, fmt: horas, menor: true},
    {k: 'ret', t: 'Voltam em até 30 dias', f: function (e) { var r = e && e.retencao_30d; return r && r.base ? r.percentual_casa : null; }, fmt: function (v) { return B.pct(v); }, nota: 'à casa'},
    {k: 'nov', t: 'Novos que voltaram (60 dias)', f: function (e) { var n = e && e.novos_60d; return n && n.base ? n.percentual_casa : null; }, fmt: function (v) { return B.pct(v); }, nota: 'só meses com 60 dias completos'},
    {k: 'ass', t: 'Assinantes ativos', f: function (e) { return e && e.assinaturas ? e.assinaturas.ativos : null; }, fmt: B.inteiro}
  ];

  // Barras horizontais: um gráfico por indicador, uma barra por barbeiro, faixas cinzas de mínimo e bônus atrás.
  function barras(alvo, w) {
    alvo.innerHTML = '';
    IND.forEach(function (ind) {
      var vals = d.barbeiros.map(function (b) { return {b: b, v: ind.f(B.PC.bloco(b.estatisticas, w))}; });
      var nums = vals.map(function (x) { return x.v; }).filter(function (v) { return v != null; });
      var topo = Math.max.apply(null, nums.concat(ind.faixas ? [ind.faixas[1] * 1.15] : []).concat([1e-9])) * 1.05;
      var card = el('div', 'min-width:0;display:flex;flex-direction:column;gap:7px;padding:14px 16px;border-radius:16px;background:rgba(255,255,255,.04)');
      var cab = el('div', 'display:flex;justify-content:space-between;align-items:baseline;gap:8px');
      cab.appendChild(el('b', "font-family:'Bebas Neue',sans-serif;font-weight:400;font-size:22px;letter-spacing:.02em", ind.t));
      if (ind.nota || ind.menor) cab.appendChild(el('small', 'font-size:11px;color:rgba(235,235,245,.62);text-align:right', (ind.menor ? 'menor é melhor' : '') + (ind.menor && ind.nota ? ' · ' : '') + (ind.nota || '')));
      card.appendChild(cab);
      // Sem nenhum valor no período, só a explicação: barras vazias não dizem nada.
      if (nums.length) vals.forEach(function (x) {
        var linha = el('div', 'display:grid;grid-template-columns:52px minmax(0,1fr) 64px;align-items:center;gap:8px;font-size:12px');
        linha.appendChild(el('span', 'color:rgba(235,235,245,.85)', x.b.barbeiro));
        var trilho = el('div', 'position:relative;height:12px;border-radius:6px;background:rgba(235,235,245,.06)');
        if (ind.faixas) {
          var a = ind.faixas[0] / topo * 100, c = ind.faixas[1] / topo * 100;
          trilho.appendChild(el('i', 'position:absolute;top:0;bottom:0;left:' + a + '%;width:' + (c - a) + '%;background:rgba(235,235,245,.12)'));
          trilho.appendChild(el('i', 'position:absolute;top:0;bottom:0;left:' + c + '%;right:0;background:rgba(235,235,245,.22);border-radius:0 6px 6px 0'));
        }
        if (x.v != null) trilho.appendChild(el('i', 'position:absolute;top:2px;bottom:2px;left:0;border-radius:0 4px 4px 0;background:' + cor[x.b.barber_id] + ';width:' + Math.max(1, x.v / topo * 100) + '%'));
        trilho.title = x.b.barbeiro + ': ' + (x.v == null ? 'sem dado' : ind.fmt(x.v));
        linha.appendChild(trilho);
        linha.appendChild(el('b', 'text-align:right;font-weight:600;font-variant-numeric:tabular-nums', x.v == null ? '—' : ind.fmt(x.v)));
        card.appendChild(linha);
      });
      if (!nums.length) card.appendChild(el('small', 'font-size:11px;color:#E3A94B', ind.k === 'nov' ? 'Os novos deste período ainda não completaram 60 dias. Escolha um mês anterior na faixa de meses.' : ind.k === 'ret' ? 'Quem veio neste período ainda não completou 30 dias. Escolha um mês fechado.' : 'Sem dado no período.'));
      if (ind.faixas) card.appendChild(el('small', 'font-size:11px;color:rgba(235,235,245,.62)', 'Faixas cinzas: mínimo ' + ind.fmt(ind.faixas[0]) + ' · bônus a partir de ' + ind.fmt(ind.faixas[1]) + ' (proposta)'));
      alvo.appendChild(card);
    });
  }

  // Meta geral de produtos da casa no mês escolhido (só janelas de mês; o dono vê o total).
  function metaCasa(alvo, w) {
    alvo.innerHTML = '';
    if (!rg) return;
    var c = B.PC.bloco(d.clientes_casa, w), mensal = /^mes/.test(w);
    var titulo = el('div', 'display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap');
    titulo.appendChild(el('b', "font-family:'Bebas Neue',sans-serif;font-weight:400;font-size:22px", 'Produtos da casa no mês'));
    alvo.appendChild(titulo);
    if (!mensal || !c || c.produto == null) { alvo.appendChild(el('small', 'font-size:12px;color:rgba(235,235,245,.7)', 'Escolha um mês no topo para ver a meta geral de produtos.')); return; }
    var v = c.produto, topo = Math.max(rg.produto_mes_bonus * 1.2, v * 1.05), per = c.periodo || (c.produto_detalhe && c.produto_detalhe.periodo);
    titulo.appendChild(el('span', "font-family:'Bebas Neue',sans-serif;font-size:28px;color:#E9CE7A", B.reais(v)));
    var faixa = v < rg.produto_mes_minimo ? 'abaixo do mínimo' : v < rg.produto_mes_bonus ? 'entre o mínimo e o bônus' : 'na faixa de bônus';
    alvo.appendChild(el('small', 'font-size:12px;color:rgba(235,235,245,.7)', faixa + (per && per.parcial ? ' · mês em andamento, até ' + B.ddmm(per.fim) : '')));
    var trilho = el('div', 'position:relative;height:14px;border-radius:7px;background:rgba(235,235,245,.08);margin-top:4px');
    var a = rg.produto_mes_minimo / topo * 100, b2 = rg.produto_mes_bonus / topo * 100;
    trilho.appendChild(el('i', 'position:absolute;top:0;bottom:0;left:' + a + '%;width:' + (b2 - a) + '%;background:rgba(235,235,245,.16)'));
    trilho.appendChild(el('i', 'position:absolute;top:0;bottom:0;left:' + b2 + '%;right:0;background:rgba(235,235,245,.28);border-radius:0 7px 7px 0'));
    trilho.appendChild(el('i', 'position:absolute;top:3px;bottom:3px;left:0;border-radius:0 5px 5px 0;background:linear-gradient(90deg,#8C6A22,#F6E39A);width:' + Math.min(100, v / topo * 100) + '%'));
    alvo.appendChild(trilho);
    var marcas = el('div', 'position:relative;height:16px;font-size:11px;font-weight:600');
    [[a, rg.produto_mes_minimo], [b2, rg.produto_mes_bonus]].forEach(function (m) { marcas.appendChild(el('span', 'position:absolute;transform:translateX(-50%);white-space:nowrap;left:' + m[0] + '%', B.reais(m[1]))); });
    alvo.appendChild(marcas);
    alvo.appendChild(el('small', 'font-size:11px;color:rgba(235,235,245,.62)', 'Meta geral proposta: mínimo ' + B.reais(rg.produto_mes_minimo) + ' (nível de agosto) e bônus a partir de ' + B.reais(rg.produto_mes_bonus) + ' (setembro). Cada barbeiro vê só a parte dele por dia trabalhado: ' + B.reais(rg.produto_dia_minimo) + ' e ' + B.reais(rg.produto_dia_bonus) + '.'));
  }

  // Mês a mês: uma linha por barbeiro no indicador escolhido, rótulo no fim de cada linha e dica ao passar o mouse.
  var meses = Object.keys(d.casa).sort(), escolhido = 'ocup';
  function linhas() {
    var ind = IND.filter(function (x) { return x.k === escolhido; })[0], alvo = B.$('#eq-meses'); alvo.innerHTML = '';
    B.$$('#eq-escolha button').forEach(function (bt) { var on = bt.getAttribute('data-k') === escolhido; bt.className = on ? 'on' : ''; bt.setAttribute('aria-checked', on ? 'true' : 'false'); });
    var ser = d.barbeiros.map(function (b) { return {b: b, pts: meses.map(function (m) { return ind.f(b.por_mes && b.por_mes[m]); })}; });
    var todos = [].concat.apply([], ser.map(function (s) { return s.pts; })).filter(function (v) { return v != null; });
    var max = Math.max.apply(null, todos.concat(ind.faixas ? [ind.faixas[1]] : []).concat([1e-9])) * 1.12;
    var W = 1100, H = 250, E = 60, Dm = 90, T = 12, Bx = 26, NS = 'http://www.w3.org/2000/svg';
    var x = function (i) { return E + (meses.length < 2 ? 0 : i * (W - E - Dm) / (meses.length - 1)); }, y = function (v) { return T + (H - T - Bx) * (1 - v / max); };
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.style.cssText = 'display:block;width:100%;height:auto;overflow:visible';
    svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', ind.t + ' mês a mês: ' + ser.map(function (s) { return s.b.barbeiro + ' ' + s.pts.map(function (v) { return v == null ? 'sem dado' : ind.fmt(v); }).join(', '); }).join('; '));
    function no(tag, at) { var n = document.createElementNS(NS, tag); for (var k in at) n.setAttribute(k, at[k]); svg.appendChild(n); return n; }
    if (ind.faixas) {
      no('rect', {x: E, width: W - E - Dm, y: y(ind.faixas[1]), height: Math.max(0, y(ind.faixas[0]) - y(ind.faixas[1])), fill: 'rgba(235,235,245,.06)'});
      no('rect', {x: E, width: W - E - Dm, y: y(max), height: Math.max(0, y(ind.faixas[1]) - y(max)), fill: 'rgba(235,235,245,.11)'});
    }
    [0, .5, 1].forEach(function (f) { var v = max / 1.12 * f; no('line', {x1: E, x2: W - Dm, y1: y(v), y2: y(v), stroke: 'rgba(235,235,245,.10)', 'stroke-width': 1}); no('text', {x: E - 8, y: y(v) + 4, 'text-anchor': 'end', fill: 'rgba(235,235,245,.62)', 'font-size': 11}).textContent = ind.fmt(v); });
    meses.forEach(function (m, i) { no('text', {x: x(i), y: H - 6, 'text-anchor': 'middle', fill: 'rgba(235,235,245,.62)', 'font-size': 11}).textContent = B.mesCurto(m) + (m >= d.hoje.slice(0, 7) ? '*' : ''); });
    var fins = [];
    ser.forEach(function (s) {
      var p = s.pts.map(function (v, i) { return v == null ? null : x(i) + ',' + y(v); }).filter(Boolean);
      if (p.length > 1) no('polyline', {points: p.join(' '), fill: 'none', stroke: cor[s.b.barber_id], 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'});
      s.pts.forEach(function (v, i) { if (v != null) no('circle', {cx: x(i), cy: y(v), r: 4, fill: cor[s.b.barber_id], stroke: '#141416', 'stroke-width': 2}); });
      for (var i = s.pts.length - 1; i >= 0; i--) if (s.pts[i] != null) { fins.push({y: y(s.pts[i]), nome: s.b.barbeiro, c: cor[s.b.barber_id]}); break; }
    });
    // Rótulos no fim das linhas, afastados para não encavalar.
    fins.sort(function (a, b) { return a.y - b.y; });
    for (var j = 1; j < fins.length; j++) if (fins[j].y - fins[j - 1].y < 14) fins[j].y = fins[j - 1].y + 14;
    fins.forEach(function (f) { no('text', {x: W - Dm + 10, y: f.y + 4, fill: '#F2EFE9', 'font-size': 12, 'font-weight': 600}).textContent = f.nome; no('rect', {x: W - Dm + 2, y: f.y - 1, width: 5, height: 3, fill: f.c}); });
    alvo.appendChild(svg);
    var dica = el('div', 'position:absolute;pointer-events:none;background:rgba(20,20,22,.94);border-radius:10px;padding:8px 10px;font-size:12px;line-height:1.5;box-shadow:0 8px 20px rgba(0,0,0,.5);display:none;white-space:nowrap');
    alvo.appendChild(dica);
    var passo = meses.length < 2 ? W : (W - E - Dm) / (meses.length - 1);
    meses.forEach(function (m, i) {
      var r = no('rect', {x: x(i) - passo / 2, y: 0, width: passo, height: H, fill: 'transparent'});
      r.addEventListener('mouseenter', function () {
        dica.innerHTML = ''; dica.appendChild(el('div', 'font-weight:600', B.mesNome(m) + (m >= d.hoje.slice(0, 7) ? ' (em andamento)' : '')));
        ser.forEach(function (s) { var l = el('div', '', s.b.barbeiro + ': ' + (s.pts[i] == null ? 'sem dado' : ind.fmt(s.pts[i]))); l.style.borderLeft = '3px solid ' + cor[s.b.barber_id]; l.style.paddingLeft = '6px'; dica.appendChild(l); });
        var cx = svg.getBoundingClientRect(), esc = cx.width / W; dica.style.display = 'block';
        dica.style.left = Math.min(x(i) * esc + 12, cx.width - dica.offsetWidth) + 'px'; dica.style.top = '6px';
      });
      r.addEventListener('mouseleave', function () { dica.style.display = 'none'; });
    });
    B.$('#eq-meses-nota').textContent = ind.t + (ind.nota ? ' (' + ind.nota + ')' : '') + (ind.faixas ? ' · faixas cinzas: mínimo e bônus propostos' : '') + ' · * mês em andamento.';
  }
  var caixa = B.$('#eq-escolha');
  IND.forEach(function (ind) {
    var bt = document.createElement('button'); bt.type = 'button'; bt.setAttribute('role', 'radio'); bt.setAttribute('data-k', ind.k); bt.textContent = ind.t;
    bt.addEventListener('click', function () { escolhido = ind.k; linhas(); }); caixa.appendChild(bt);
  });
  var leg = B.$('#eq-legenda');
  d.barbeiros.forEach(function (b) { var s = el('span', 'display:inline-flex;align-items:center;gap:6px;font-size:12px;color:rgba(235,235,245,.85)'); s.appendChild(el('i', 'display:inline-block;width:14px;height:4px;border-radius:2px;background:' + cor[b.barber_id])); s.appendChild(document.createTextNode(b.barbeiro)); leg.appendChild(s); });
  linhas();

  document.addEventListener('bancada:periodo', function (ev) { var w = ev.detail; barras(B.$('#eq-barras'), w); metaCasa(B.$('#eq-meta'), w); });
});
