/* Celular · A casa: a barbearia inteira no período (atendimentos e pessoas) com a parte do barbeiro,
   e quanto a casa segura do mês anterior. Sem faturamento da casa no celular. */
Bancada.pronto(function (d) {
  var B = Bancada, b = B.eu(d);
  if (!b) return;
  B.levarBarbeiro(b.barber_id);
  // Atendimentos somam entre barbeiros (cada um é de um só); no "dia", só quem trabalhou no último dia da casa.
  function atendimentos(w, casa) {
    var soma = 0, algum = false;
    d.barbeiros.forEach(function (x) {
      var e = x.estatisticas && x.estatisticas[w];
      if (!e) return;
      if (w === 'ultimo_dia' && (!casa || !e.periodo || e.periodo.inicio !== casa.periodo.inicio)) return;
      soma += e.atendimentos || 0; algum = true;
    });
    return algum ? soma : null;
  }
  B.Celular.periodos(function (w) {
    var casa = d.clientes_casa && d.clientes_casa[w], e = b.estatisticas && b.estatisticas[w];
    var eu = e && e.clientes;
    if (w === 'ultimo_dia' && casa && e && e.periodo && e.periodo.inicio !== casa.periodo.inicio) eu = null, e = null;
    B.$('#janela').textContent = B.Celular.janela(casa && casa.periodo, w);
    var minha = {atendimentos: e ? e.atendimentos : null, unicos: eu && eu.unicos, novos: eu && eu.novos, ativos: e && e.assinaturas && e.assinaturas.ativos};
    var total = {atendimentos: atendimentos(w, casa), unicos: casa && casa.unicos, novos: casa && casa.novos, ativos: casa && casa.assinaturas && casa.assinaturas.ativos};
    B.$$('.num').forEach(function (n) {
      var k = n.getAttribute('data-k'), c = total[k], v = minha[k];
      n.querySelector('b').textContent = B.inteiro(c);
      n.querySelector('small').textContent = v == null ? 'sem dado seu' : B.inteiro(v) + ' com você' + (c ? ' (' + B.pct(v / c * 100) + ')' : '');
    });
    B.Celular.retorno(casa && d.clientes_casa.mes && d.clientes_casa.mes.retorno, null, d);
  });
  B.$('.palco > div > p').textContent = 'A barbearia inteira, com a sua parte ao lado. Clientes são pessoas; uma pessoa pode passar por mais de um barbeiro.';
});
