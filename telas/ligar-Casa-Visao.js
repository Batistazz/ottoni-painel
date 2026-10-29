/* Casa · Visão geral: casa por mês (certo) e por barbeiro (estimativa D16). Os meses são botões. */
Bancada.pronto(function (d) {
  var B = Bancada, meses = Object.keys(d.casa).sort().slice(-4), mesAtual = d.hoje.slice(0, 7);
  var fechados = meses.filter(function (m) { return m < mesAtual; });
  var sel = B.param('mes');
  if (meses.indexOf(sel) < 0) sel = fechados[fechados.length - 1] || meses[meses.length - 1];
  var botoes = B.$$('button.mes');

  botoes.forEach(function (btn, i) {
    var m = meses[i];
    if (!m) { btn.style.display = 'none'; return; }
    var aberto = m >= mesAtual, c = d.casa[m];
    btn.innerHTML = B.mesNome(m) + '<b' + (aberto ? ' style="color: #E3A94B"' : '') + '>' + (aberto ? 'parcial' : B.inteiro(c.total)) + '</b>';
    btn.style.color = aberto ? '#E3A94B' : '';
    btn.addEventListener('click', function () { sel = m; desenhar(); });
  });

  var rows = B.$$('section .med');
  // Faturamento por dia trabalhado (regra B): total estimado do mês ÷ dias trabalhados no mês.
  function porDia(m, b) { var p = b.por_mes && b.por_mes[m]; return p && p.total != null && p.dias_trabalhados ? p.total / p.dias_trabalhados : null; }
  function dias(m, b) { var p = b.por_mes && b.por_mes[m]; return p ? p.dias_trabalhados : null; }

  function desenhar() {
    botoes.forEach(function (btn, i) { var on = meses[i] === sel; btn.classList.toggle('on', on); btn.setAttribute('aria-selected', on ? 'true' : 'false'); });
    var c = d.casa[sel], i = meses.indexOf(sel), aberto = sel >= mesAtual;
    var obs = c.periodo && c.periodo.observado_ate;
    B.$('span.rot').textContent = 'A casa · ' + B.mesNome(sel) + ' de ' + sel.slice(0, 4) + (aberto && obs ? ' até ' + B.ddmm(obs) : '') + ' · comanda + mensalidade';
    var grande = B.$('main.conteudo > div > div > div');
    grande.textContent = B.reais(c.total);
    grande.nextElementSibling.lastChild.nodeValue = 'certo · mensalidades ' + B.reais(c.mensalidade) + (c.parcial ? ' · parcial' : '');

    // Três meses até o selecionado: finas = anteriores, dourada = selecionado.
    var tres = meses.slice(Math.max(0, i - 2), i + 1);
    var max = 0;
    d.barbeiros.forEach(function (b) { tres.forEach(function (m) { var x = porDia(m, b); if (x > max) max = x; }); });
    var ordem = d.barbeiros.slice().sort(function (a, b) { return (porDia(sel, b) || 0) - (porDia(sel, a) || 0); });
    rows.forEach(function (row, k) {
      var b = ordem[k];
      if (!b) { row.style.display = 'none'; return; }
      row.querySelector('.r').textContent = b.barbeiro;
      var is = row.querySelectorAll('.t i');
      for (var j = 0; j < 3; j++) {
        var m = tres[tres.length - 3 + j], x = m && porDia(m, b);
        is[j].style.width = x && max ? (x / max * 100).toFixed(1) + '%' : '0%';
      }
      var atual = porDia(sel, b);
      row.querySelector('b').textContent = atual != null ? B.inteiro(Math.round(atual)) : '—';
    });
    var titulos = B.$$('.painel-tit');
    titulos[0].textContent = 'Por barbeiro · ' + tres.map(B.mesCurto).join(', ').replace(/, ([^,]*)$/, ' e $1');
    var leg = titulos[0].nextElementSibling;
    leg.lastChild.nodeValue = 'estimativa · R$ por dia trabalhado' + (d.casa[sel].parcial ? ' · ' + B.mesCurto(sel) + ' parcial' : '');
    var ds = ordem.map(function (b) { var x = dias(sel, b); return x ? b.barbeiro + ' ' + x : null; }).filter(Boolean).join(', ');
    var p = titulos[0].parentNode.parentNode.querySelector('p');
    p.firstChild.nodeValue = (tres.length > 1 ? 'Linhas finas: ' + tres.slice(0, -1).map(B.mesNome).join(' e ') + '. ' : '') + 'Linha dourada: ' + B.mesNome(sel) + '. Dias trabalhados em ' + B.mesNome(sel) + ': ' + ds + '. ';

    // Duas partes do mês selecionado.
    titulos[1].textContent = B.mesNome(sel).replace(/^./, function (x) { return x.toUpperCase(); }) + ' em duas partes';
    var comanda = c.total - c.mensalidade, pc = c.total ? comanda / c.total * 100 : 0;
    var barra = titulos[1].nextElementSibling, partes = barra.querySelectorAll('i');
    partes[0].style.flex = pc.toFixed(1); partes[1].style.flex = (100 - pc).toFixed(1);
    barra.setAttribute('aria-label', 'Comanda com produto ' + B.reais(comanda) + ', ' + Math.round(pc) + '%; mensalidades ' + B.reais(c.mensalidade) + ', ' + Math.round(100 - pc) + '%');
    var nums = barra.nextElementSibling.children;
    nums[0].children[1].textContent = B.inteiro(comanda); nums[0].children[2].textContent = Math.round(pc) + '% · com produto';
    nums[1].children[1].textContent = B.inteiro(c.mensalidade); nums[1].children[2].textContent = Math.round(100 - pc) + '% · pela data de pagamento';

    // Variações entre meses vizinhos.
    var vars = barra.nextElementSibling.nextElementSibling.children;
    [[i - 2, i - 1], [i - 1, i]].forEach(function (par, k) {
      var a = meses[par[0]], z = meses[par[1]], el = vars[k];
      if (!a || !z) { el.style.visibility = 'hidden'; return; }
      el.style.visibility = '';
      var v = B.variacao(d.casa[a].total, d.casa[z].total);
      el.children[0].textContent = B.mesCurto(a).replace(/^./, function (x) { return x.toUpperCase(); }) + ' → ' + B.mesCurto(z) + (d.casa[z].parcial ? ' (parcial)' : '');
      el.children[1].textContent = v;
      el.children[1].style.color = v && v.charAt(0) === '+' ? '#63C08E' : '#E3A94B';
    });
    var q = new URLSearchParams(location.search); q.set('mes', sel); history.replaceState(null, '', '?' + q.toString());
    // O topo acompanha o mês escolhido: corrente = Mês, anterior = Mês anterior, outro = nenhum.
    var mesAnt = B.mesAnterior(d.hoje);
    B.$$('.seg[aria-label="Período"] button').forEach(function (bt) {
      var t = bt.textContent.trim(), on = (t === 'Mês' && sel === mesAtual) || (t === 'Mês anterior' && sel === mesAnt);
      bt.classList.toggle('on', on); bt.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }
  // Faturamento da casa é por mês: Hoje e Semana não se aplicam aqui.
  B.PC.apagar(['Hoje', 'Semana'], 'A casa em reais é fechada por mês');
  var pedido = B.param('mes');
  B.PC.periodos(function (w) {
    if (pedido) { pedido = null; } // mês vindo do endereço tem prioridade na primeira abertura
    else if (w.indexOf('mes:') === 0 && d.casa[w.slice(4)]) sel = w.slice(4);
    else if (w === 'mes') sel = mesAtual;
    else if (w === 'mes_anterior') sel = B.mesAnterior(d.hoje);
    if (d.casa[sel]) desenhar();
  }, B.param('periodo') ? null : 'mes_anterior');
});
