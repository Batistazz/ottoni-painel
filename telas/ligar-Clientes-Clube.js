/* Clientes · Clube: mensalidades por mês (certo), retorno e contagens do plano de ação. Nenhum nome de cliente. */
Bancada.pronto(function (d) {
  var B = Bancada, meses = Object.keys(d.casa).sort().slice(-4), mesAtual = d.hoje.slice(0, 7);
  var max = Math.max.apply(null, meses.map(function (m) { return d.casa[m].mensalidade; }));
  var rows = B.$$('.med'), ariaPartes = [];
  rows.forEach(function (row, i) {
    var m = meses[i];
    if (!m) { row.style.display = 'none'; return; }
    var c = d.casa[m], aberto = m >= mesAtual;
    row.querySelector('.r').textContent = B.mesCurto(m).toUpperCase();
    var barra = row.querySelector('.t i');
    barra.style.width = (c.mensalidade / max * 100).toFixed(1) + '%';
    barra.classList.toggle('parcial', aberto);
    row.querySelector('b').textContent = B.inteiro(c.mensalidade);
    ariaPartes.push(B.mesNome(m) + (aberto ? ' até dia ' + B.data(c.periodo.observado_ate).getDate() : '') + ' ' + B.reais(c.mensalidade) + (aberto ? ', parcial' : ''));
  });
  var grafico = rows[0].parentNode;
  grafico.setAttribute('aria-label', 'Mensalidades pagas: ' + ariaPartes.join(', '));
  var ultimo = d.casa[meses[meses.length - 1]];
  grafico.nextElementSibling.textContent = (meses[meses.length - 1] >= mesAtual ? B.mesNome(meses[meses.length - 1]).replace(/^./, function (x) { return x.toUpperCase(); }) + ' até o dia ' + B.data(ultimo.periodo.observado_ate).getDate() + ', parcial. ' : '') + 'Valores em reais, pela data de pagamento.';

  var r = d.retorno;
  var nums = B.$$('.num');
  // Os dois cartões da direita seguem o período do topo: retenção da casa e assinaturas.
  B.PC.periodos(function (w) {
    var c = B.PC.bloco(d.clientes_casa, w), r30 = c && c.retencao_30d, a = c && c.assinaturas;
    var per = c && c.periodo ? B.Celular.janela(c.periodo, w) : '';
    if (r30 && r30.base) {
      nums[0].previousElementSibling.textContent = 'Voltam em até 30 dias';
      nums[0].textContent = B.pct(r30.percentual_casa, 1);
      nums[0].nextElementSibling.textContent = per + ' · ' + B.inteiro(r30.voltaram_casa) + ' de ' + B.inteiro(r30.base) + ' pessoas voltaram' + (r30.em_aberto ? '; ' + B.inteiro(r30.em_aberto) + ' ainda sem 30 dias' : '');
    } else {
      // Período recente: ninguém completou 30 dias; mostra a volta de um mês para o outro.
      var cm = B.PC.bloco(d.clientes_casa, /^mes/.test(w) ? w : 'mes'), rm = cm && cm.retorno;
      nums[0].previousElementSibling.textContent = 'Voltaram no mês seguinte';
      nums[0].textContent = rm && rm.base ? B.pct(rm.percentual_casa, 1) : '—';
      nums[0].nextElementSibling.textContent = rm && rm.base ? B.inteiro(rm.voltaram_casa) + ' de ' + B.inteiro(rm.base) + ' pessoas de ' + B.mesNome(rm.periodo_base.inicio.slice(0, 7)) + ' voltaram no mês seguinte' + (rm.parcial ? ', até agora' : '') + '. Em até 30 dias: ainda em aberto neste período.' : 'sem base';
    }
    nums[1].previousElementSibling.textContent = 'Assinantes ativos';
    nums[1].textContent = a ? B.inteiro(a.ativos) : '—';
    nums[1].nextElementSibling.textContent = a ? per + ' · ' + B.inteiro(a.novas) + ' assinaram, ' + B.inteiro(a.nao_renovaram) + ' não renovaram' + (a.a_vencer ? ', ' + B.inteiro(a.a_vencer) + ' a vencer' : '') + ' · ' + B.inteiro(a.mensalidades_pagas) + ' mensalidades pagas (' + B.reais(a.mensalidades_valor) + ')' : 'sem dados no período';
  }, B.PC.padrao(d), Object.keys(d.casa).sort());

  var prior = r && r.prioritarios, novos = d.chamar && d.chamar.grupos && d.chamar.grupos['novo sem 2ª visita'];
  var acoes = B.$$('.acao');
  if (acoes[0]) acoes[0].children[2].textContent = prior != null ? prior + ' clientes prioritários' : 'sem dado ainda';
  // "Novos sem 2ª visita" ao vivo da Recepção (toda a história), não do arquivo antigo calculado sem ela.
  if (acoes[1]) acoes[1].children[2].textContent = 'contando…';
  fetch('/api/reception', {cache: 'no-store'}).then(function (r) { return r.json(); }).then(function (j) {
    var n = j.grupos && j.grupos['novo sem 2ª visita'];
    if (acoes[1]) acoes[1].children[2].textContent = n != null ? n + ' novos sem 2ª visita' : 'sem dado ainda';
  }).catch(function () { if (acoes[1]) acoes[1].children[2].textContent = 'sem dado ainda'; });
  // Cada cartão leva aonde a ação acontece: chamar é na Recepção; produto se compara entre barbeiros.
  function link(i, texto, href) { var a = acoes[i] && acoes[i].querySelector('a.ctx'); if (a) { a.textContent = texto; a.href = href; } }
  link(0, 'Chamar na Recepção', 'Hoje-Recepcao.html');
  link(1, 'Chamar na Recepção', 'Hoje-Recepcao.html');
  var pc = d.clientes_casa && d.clientes_casa.mes && d.clientes_casa.mes.produto_detalhe;
  if (acoes[2]) acoes[2].children[2].textContent = pc ? B.pct(pc.percentual_atendimentos_com_produto, 1) + ' dos atendimentos saem com produto' : 'sem dado ainda';
  link(2, 'Comparar barbeiros', 'Equipe-Barbeiros.html?periodo=mes');
  if (acoes[3]) acoes[3].children[2].textContent = 'ainda sem número publicado';
  var prim = B.$('.rodape a.prim');
  if (prim) { prim.textContent = prior != null ? 'Ver os ' + prior + ' prioritários' : 'Ver prioritários'; prim.href = 'Hoje-Recepcao.html'; prim.title = 'Quem chamar, com nome, WhatsApp e registro do resultado, fica na Recepção.'; }

  // Plano de ação: setas mostram uma ação por vez no contador.
  var cont = B.$$('span').filter(function (s) { return /^\d+ de \d+$/.test(s.textContent.trim()); })[0], atual = 0;
  var botoes = B.$$('.bolinha');
  function mover(k) {
    atual = (atual + k + acoes.length) % acoes.length;
    if (cont) cont.textContent = (atual + 1) + ' de ' + acoes.length;
    acoes[atual].scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'center'});
    acoes.forEach(function (a, i) { a.style.outline = i === atual ? '1px solid rgba(242,239,233,.55)' : ''; });
  }
  if (botoes[0]) botoes[0].addEventListener('click', function () { mover(-1); });
  if (botoes[1]) botoes[1].addEventListener('click', function () { mover(1); });
});

/* "Como contamos" no cartão de assinantes: a definição aparece ali mesmo (o link antigo levava ao método do D16). */
Bancada.pronto(function () {
  var B = Bancada, a = B.$$('a.ctx').filter(function (x) { return /Ver método/.test(x.textContent); })[0];
  if (!a) return;
  a.textContent = 'Como contamos'; a.href = '#';
  var p = document.createElement('p');
  p.style.cssText = 'display:none;margin:8px 0 0;font-size:12px;line-height:1.5;color:rgba(235,235,245,.7)';
  p.textContent = 'Pessoas, não pagamentos. Ativo: a mensalidade cobre o fim do período (ciclo de 31 dias depois do pagamento, ou até o próximo). ' +
    'Assinou: primeiro pagamento da pessoa em toda a história. Não renovou: o ciclo acabou no período e passaram 7 dias sem novo pagamento; ' +
    'se os 7 dias ainda não passaram, fica "a vencer". Estorno não conta. Por barbeiro: o assinante é de quem mais cortou com ele nos últimos 60 dias (D23). ' +
    'Mensalidades pagas: quantidade e reais pela data do pagamento (D16).';
  a.parentNode.appendChild(p);
  a.addEventListener('click', function (ev) { ev.preventDefault(); var abrir = p.style.display === 'none'; p.style.display = abrir ? 'block' : 'none'; a.textContent = abrir ? 'Fechar' : 'Como contamos'; });
});
