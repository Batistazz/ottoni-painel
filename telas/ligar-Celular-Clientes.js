/* Celular · Meus clientes: pessoas atendidas pelo barbeiro (únicos, novos, assinantes, avulsos) ao lado da casa,
   e quem voltou do mês anterior (à casa e com ele). Só agregados; pessoas, nunca atendimentos. */
Bancada.pronto(function (d) {
  var B = Bancada, b = B.eu(d);
  var SERV = {corte: 'Corte', barba: 'Barba', sobrancelha: 'Sobrancelha', acabamento: 'Pezinho e acabamento', selagem: 'Selagem', hidratacao: 'Hidratação', pintura: 'Pintura', relaxamento: 'Relaxamento', progressiva: 'Progressiva', luzes: 'Luzes e platinado', barboterapia: 'Barboterapia', depilacao: 'Depilação', limpeza: 'Limpeza de pele', outros: 'Outros'};
  function parte(n, t) { if (!t) return '—'; var p = n / t * 100; return p > 0 && p < 1 ? '<1%' : B.pct(p); }
  if (!b) return;
  B.levarBarbeiro(b.barber_id);
  B.Celular.periodos(function (w) {
    var eu = b.estatisticas && b.estatisticas[w] && b.estatisticas[w].clientes, casa = d.clientes_casa && d.clientes_casa[w];
    // O último dia dele pode não ser o último dia da casa: aí a casa não entra na conta.
    var outroDia = w === 'ultimo_dia' && eu && casa && eu.periodo && casa.periodo && eu.periodo.inicio !== casa.periodo.inicio;
    if (outroDia) casa = null;
    B.$('#janela').textContent = b.barbeiro + ' · ' + B.Celular.janela(eu && eu.periodo, w);
    var a = b.estatisticas && b.estatisticas[w] && b.estatisticas[w].assinaturas;
    B.$$('.num').forEach(function (n) {
      var k = n.getAttribute('data-k'), small = n.querySelector('small');
      if (k === 'ativos') {
        // Assinantes que contam para ele (com quem mais cortaram nos últimos 60 dias).
        n.querySelector('b').textContent = B.inteiro(a && a.ativos);
        small.textContent = a ? B.inteiro(a.novas) + (a.novas === 1 ? ' assinou · ' : ' assinaram · ') + B.inteiro(a.nao_renovaram) + (a.nao_renovaram === 1 ? ' não renovou' : ' não renovaram') : 'sem dados';
        return;
      }
      var v = eu ? eu[k] : null, c = casa ? casa[k] : null;
      n.querySelector('b').textContent = B.inteiro(v);
      small.textContent = outroDia ? 'casa: outro dia' : c == null ? 'sem dado da casa' : !c ? 'nenhum na casa' : (v != null ? B.pct(v / c * 100) + ' dos ' : 'de ') + B.inteiro(c) + ' da casa';
      if (k === 'unicos' && eu) small.textContent += ' · ' + B.inteiro(eu.avulsos) + ' avulsos';
    });
    var r = b.estatisticas && b.estatisticas.mes && b.estatisticas.mes.clientes && b.estatisticas.mes.clientes.retorno;
    B.Celular.retorno(r, 'voltaram com você', d);

    // Serviços do período: vezes e parte dos seus atendimentos, com a mesma parte na equipe.
    var e = b.estatisticas && b.estatisticas[w], sv = e && e.servicos, lst = B.$('#sv-lista'); lst.innerHTML = '';
    var eqAt = 0, eqF = {};
    // No "Dia" cada barbeiro tem a sua data: a equipe entra só com quem trabalhou no mesmo dia.
    d.barbeiros.forEach(function (x) { var z = x.estatisticas && x.estatisticas[w] && x.estatisticas[w].servicos; if (!z) return;
      if (w === 'ultimo_dia' && !(e && e.periodo && x.estatisticas[w].periodo && e.periodo.inicio === x.estatisticas[w].periodo.inicio)) return; eqAt += z.atendimentos; Object.keys(z.familias).forEach(function (k) { eqF[k] = (eqF[k] || 0) + z.familias[k].vezes; }); });
    if (sv && sv.atendimentos) Object.keys(sv.familias).sort(function (a, c) { return (a === 'outros') - (c === 'outros') || sv.familias[c].vezes - sv.familias[a].vezes; }).slice(0, 6).forEach(function (k) {
      var f = sv.familias[k];
      linha(lst, SERV[k] || k, B.inteiro(f.vezes), parte(f.vezes, sv.atendimentos) + ' dos seus · equipe ' + parte(eqF[k] || 0, eqAt));
    });
    else linha(lst, 'Sem atendimentos no período', '—', '');
    B.$('#sv-nota').textContent = sv && sv.atendimentos ? B.inteiro(sv.atendimentos) + ' atendimentos. "Corte + barba" conta nas duas linhas.' : '';
  });

  // Clientes novos (primeira visita na casa foi com você) que voltaram em até 60 dias, por mês.
  var nl = B.$('#nv-lista'), meses = Object.keys(b.por_mes || {}).sort();
  meses.forEach(function (m) {
    var n = b.por_mes[m].novos_60d; if (!n || !n.novos) return;
    linha(nl, B.mesNome(m), n.base ? B.pct(n.percentual_casa) : '—', n.base ? B.inteiro(n.voltaram_casa) + ' de ' + B.inteiro(n.base) + ' · com você ' + B.pct(n.percentual_com_ele) : B.inteiro(n.novos) + ' novos, ainda sem 60 dias');
  });
  B.$('#nv-nota').textContent = 'Voltaram à casa em até 60 dias depois da primeira visita. Poucos por mês: diferença pequena pode ser acaso.';
  function linha(alvo, rot, val, sub) {
    var l = document.createElement('div'), t = document.createElement('span'), v = document.createElement('b');
    l.className = 'linha'; l.style.alignItems = 'baseline'; t.textContent = rot;
    if (sub) { var s = document.createElement('small'); s.textContent = sub; s.style.cssText = 'display:block;font-size:11px;color:rgba(235,235,245,.62)'; t.appendChild(s); }
    v.textContent = val; l.appendChild(t); l.appendChild(v); alvo.appendChild(l);
  }
  B.$('.palco > div > p').textContent = 'Pessoas diferentes, não atendimentos. "Novo" = primeira visita à casa foi com você. Casa ao lado; uma pessoa pode passar por mais de um barbeiro.';
});
