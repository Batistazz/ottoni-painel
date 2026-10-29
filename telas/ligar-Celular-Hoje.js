/* Celular · Hoje (lente Barbeiro): carta, meta proposta do dia e números por dia trabalhado contra a média da equipe. */
Bancada.pronto(function (d) {
  var B = Bancada, b = B.eu(d);
  if (!b) return;
  B.levarBarbeiro(b.barber_id);
  B.$('h1 span').textContent = b.barbeiro;
  B.pintarCarta(d, b, B.$('.fut'));
  var bloco = B.$('.fut').parentNode.nextElementSibling;
  B.pintarMeta(b, d.hoje, bloco.querySelector('.rot'), bloco.children[1], bloco.querySelector('i'), bloco.children[3]);

  // Por dia trabalhado, para comparar barbeiros com escalas diferentes. "Dia" é o último dia trabalhado de cada um.
  var meds = B.$$('section .med'), legenda = meds[0].parentNode.querySelector('section > span');
  var pessoas = document.createElement('span');
  pessoas.style.cssText = 'font-size: 13px; color: rgba(235,235,245,.8)';
  legenda.parentNode.insertBefore(pessoas, legenda);
  function porDia(e, k) { return e && e.dias_trabalhados ? e[k] / e.dias_trabalhados : null; }
  B.$('.seg button').textContent = 'Dia';
  B.Celular.periodos(function (w) {
    [['atendimentos', 'Atendimentos por dia', function (v) { return v.toLocaleString('pt-BR', {maximumFractionDigits: 1}); }],
     ['produto', 'Produto por dia', B.reais]].forEach(function (cfg, j) {
      var med = meds[j], eu = porDia(b.estatisticas && b.estatisticas[w], cfg[0]);
      var todos = d.barbeiros.map(function (x) { return porDia(x.estatisticas && x.estatisticas[w], cfg[0]); }).filter(function (v) { return v != null; });
      var media = todos.length ? todos.reduce(function (a, v) { return a + v; }, 0) / todos.length : null;
      var topo = Math.max.apply(null, todos.concat([1]));
      med.querySelector('.rot').textContent = cfg[1];
      med.querySelector('b').textContent = eu == null ? '—' : cfg[2](eu);
      med.querySelectorAll('.t i')[0].style.width = eu == null ? '0%' : Math.round(eu / topo * 100) + '%';
      med.querySelectorAll('.t i')[1].style.width = media == null ? '0%' : Math.round(media / topo * 100) + '%';
    });
    var c = b.estatisticas && b.estatisticas[w] && b.estatisticas[w].clientes;
    pessoas.textContent = c ? B.Celular.janela(c.periodo, w) + ': ' + B.inteiro(c.unicos) + ' clientes, ' + B.inteiro(c.assinantes) + ' assinantes, ' + B.inteiro(c.novos) + ' novos' : 'sem dados no período';
    legenda.textContent = 'Linha dourada: você. Linha fina: média da equipe.';
    // Régua: o quanto da capacidade da sua cadeira você usou, com mínimo e bônus propostos.
    var rg = d.clientes_casa && d.clientes_casa.regua;
    B.regua(B.$('#regua'), b.estatisticas && b.estatisticas[w], rg);
    B.reguaProduto(B.$('#regua-produto'), b.estatisticas && b.estatisticas[w], rg);
    B.$('#regua-nota').textContent = rg ? 'Capacidade = suas horas abertas ÷ seu tempo médio por atendimento. Mínimo ' + rg.minimo_pct + '% e bônus a partir de ' + rg.bonus_pct + '% da capacidade; produto, a sua parte na meta da casa: mínimo ' + B.reais(rg.produto_dia_minimo) + ' e bônus a partir de ' + B.reais(rg.produto_dia_bonus) + ' por dia trabalhado. Proposta, ainda não aprovada.' : '';
  });
  B.$('.palco > div > p').textContent = 'Você vê só os seus números e a média da equipe. Meta proposta pelo sistema, ainda não aprovada.';
});
