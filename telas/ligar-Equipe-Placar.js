/* Equipe · Placar: cartas com as notas do placar atual (último mês fechado, proposta). Cartas são botões. */
Bancada.pronto(function (d) {
  Bancada.PC.semPeriodo('O placar é do último mês fechado.');
  var B = Bancada, pl = d.placar;
  var notaRodape = B.$$('aside p').pop();
  if (!pl) { if (notaRodape) notaRodape.textContent = 'Placar indisponível: sem notas publicadas.'; return; }
  var mesNome = B.mesNome(pl.mes);
  var cartas = pl.cartas.filter(function (c) { return c.barbeiro !== 'Igor'; }).sort(function (a, b) { return b.overall - a.overall; });
  // Posições do desenho: esquerda = 2º, centro = 1º, direita = 3º.
  var lugares = B.$$('.campo .fut'), ordem = [cartas[1], cartas[0], cartas[2]];
  B.$('section h1').nextElementSibling.textContent = mesNome.replace(/^./, function (x) { return x.toUpperCase(); }) + ' de ' + pl.mes.slice(0, 4);

  function montar(el, c) {
    var a = B.atributos(c);
    el.className = 'fut ' + B.faixa(c.overall);
    el.innerHTML = '<div class="topo"><div><div class="ovr">' + c.overall + '</div><div class="pos">BAR</div></div>' +
      '<svg class="busto" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="36" r="19" fill="currentColor" opacity=".28"></circle><path d="M12 100c2-25 19-38 38-38s36 13 38 38z" fill="currentColor" opacity=".28"></path></svg></div>' +
      '<div class="nome">' + c.barbeiro.toUpperCase() + '</div>' +
      '<div class="stats">' + ['ATD', 'RET', 'NOV', 'PRO', 'EXT', 'PRE'].map(function (k) { return '<span><b>' + (a[k] == null ? '—' : a[k]) + '</b>' + k + '</span>'; }).join('') + '</div>' +
      '<div class="pe">OTTONI</div>';
    var alvo = el.parentNode;
    alvo.style.cursor = 'pointer';
    alvo.setAttribute('role', 'button'); alvo.setAttribute('tabindex', '0');
    alvo.setAttribute('aria-label', 'Abrir ' + c.barbeiro + ' na tela Hoje');
    var ir = function () { location.href = 'Barbeiro.html?periodo=mes_anterior&barbeiro=' + c.barber_id; };
    alvo.addEventListener('click', ir);
    alvo.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ir(); } });
  }
  lugares.forEach(function (el, i) { if (ordem[i]) montar(el, ordem[i]); else el.parentNode.style.display = 'none'; });

  var campo = B.$('.campo');
  campo.setAttribute('aria-label', 'Campo com as cartas: ' + ordem.filter(Boolean).map(function (c) { return c.barbeiro + ' ' + B.faixa(c.overall) + ' ' + c.overall; }).join(', '));
  B.trocar('Destaque da semana · Kevim', 'Destaque de ' + mesNome + ' · ' + cartas[0].barbeiro);
  var prim = B.$('.rodape a.prim');
  if (prim) { prim.textContent = 'Abrir o relatório do ' + cartas[0].barbeiro; prim.href = 'Barbeiro.html?periodo=mes_anterior&barbeiro=' + cartas[0].barber_id; }

  // Objetivos da semana a partir da Recepção (contagem com toda a história e registro de contatos); sem número inventado.
  var missoes = B.$$('.missao');
  function missao(i, texto, pct) {
    var m = missoes[i]; if (!m) return;
    var corpo = m.querySelector(':scope > div');
    if (corpo && corpo.children[1]) corpo.children[1].textContent = texto;
    var barra = m.querySelector('.barra i'); if (barra) barra.style.width = (pct == null ? 0 : Math.max(0, Math.min(100, pct))) + '%';
  }
  missao(0, 'contando…'); missao(1, 'contando…');
  missao(2, 'fica para depois: metas serão combinadas pelo Igor (D20)');
  fetch('/api/reception', {cache: 'no-store'}).then(function (r) { return r.json(); }).then(function (j) {
    var g = j.grupos || {}, sem = j.semanas && j.semanas[j.semanas.length - 1];
    missao(0, g['novo sem 2ª visita'] != null ? g['novo sem 2ª visita'] + ' clientes novos ainda sem a 2ª visita' : 'sem dado');
    missao(1, sem && sem.contatos ? sem.vieram + ' de ' + sem.contatos + ' chamados nesta semana voltaram' : 'nenhum contato registrado nesta semana (Recepção › Quem chamar)', sem && sem.contatos ? sem.vieram / sem.contatos * 100 : 0);
  }).catch(function () { missao(0, 'sem dado'); missao(1, 'sem dado'); });
  if (notaRodape) notaRodape.textContent = 'ATD atendimentos · RET clientes que voltam em 30 dias · NOV clientes novos por dia · PRO produto · EXT serviços por atendimento (conta também itens do plano, sem cobrança): notas de ' + mesNome + ', de 50 a 99, relativas à equipe. A nota geral soma também ticket avulso e evolução, que não aparecem na carta. PRE (presença) fica sem nota até a escala ser confirmada. Cálculo proposto, não aprovado.';
});
