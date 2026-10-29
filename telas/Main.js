/* Hoje · lente Dono com dados reais. Período e barbeiro ficam no endereço (?periodo=&barbeiro=). */
Bancada.pronto(function (d) {
  var B = Bancada;
  var P = ['Hoje', 'Semana', 'Mês', 'Mês anterior'], CH = ['hoje', 'semana', 'mes', 'mes_anterior'];
  var L = ['Dono', 'Barbeiro', 'Recepção'];
  var IDS = ['equipe'].concat(d.barbeiros.map(function (b) { return b.barber_id; }));
  var mesAtual = d.hoje.slice(0, 7), mesAnt = B.mesAnterior(d.hoje);
  var obs = d.casa[mesAtual] && d.casa[mesAtual].periodo.observado_ate;

  function faixaDatas(per) { return per ? B.ddmm(per.inicio) + '–' + B.ddmm(per.fim) : ''; }
  function d16(mes, id) {
    var m = d.d16[mes];
    return m ? m.barbeiros.filter(function (x) { return x.barber_id === id; })[0] || null : null;
  }
  // Legendas curtas como no desenho; a linha diz a confiança: contínua = certo, tracejada = estimativa.
  var SEM = 'sem dado';
  function vazio(rotulo) { return {n: SEM, l: rotulo, t: 'solid'}; }
  // "Hoje" nos números = último dia coletado (o dia corrente entra na coleta de amanhã).
  // Casa: soma dos barbeiros que trabalharam no último dia da casa; barbeiro: o último dia trabalhado dele.
  function ultimoDia(id) {
    var ref = d.clientes_casa && d.clientes_casa.ultimo_dia && d.clientes_casa.ultimo_dia.periodo && d.clientes_casa.ultimo_dia.periodo.inicio;
    var lista = d.barbeiros.filter(function (b) { return id === 'equipe' || b.barber_id === id; }).map(function (b) { return b.estatisticas && b.estatisticas.ultimo_dia; })
      .filter(function (u) { return u && u.periodo && u.periodo.inicio && (id !== 'equipe' || u.periodo.inicio === ref); });
    if (!lista.length) return null;
    return {data: lista[0].periodo.inicio, comanda: lista.reduce(function (a, u) { return a + (u.comanda || 0); }, 0), total: lista.every(function (u) { return u.total != null; }) ? lista.reduce(function (a, u) { return a + u.total; }, 0) : null, atendimentos: lista.reduce(function (a, u) { return a + (u.atendimentos || 0); }, 0)};
  }

  // Faturamento: casa = certo (comanda + mensalidade); barbeiro = estimativa D16, tracejado.
  function faturamento(p, id) {
    if (p === 0) { var u = ultimoDia(id); return u ? (u.total != null ? {n: B.reais(u.total), l: 'com assinaturas · ' + B.ddmm(u.data) + ', último dia coletado', t: 'dashed'} : {n: B.reais(u.comanda), l: 'comanda de ' + B.ddmm(u.data) + ', último dia coletado', t: 'solid'}) : vazio('sem dia coletado'); }
    if (id === 'equipe') {
      if (p === 1) {
        var st = d.barbeiros.map(function (b) { return b.estatisticas && b.estatisticas.semana; });
        if (st.some(function (x) { return !x; })) return vazio('comanda da semana');
        var casaS = d.clientes_casa && d.clientes_casa.estatisticas && d.clientes_casa.estatisticas.semana;
        if (casaS && casaS.total != null) return {n: B.reais(casaS.total), l: 'com assinaturas (por visita)' + (casaS.periodo && casaS.periodo.parcial ? ' · parcial' : ''), t: 'dashed'};
        var soma = st.reduce(function (a, x) { return a + x.comanda; }, 0);
        return {n: B.reais(soma), l: 'comanda, sem mensalidade' + (st[0].periodo.parcial ? ' · parcial' : ''), t: 'solid'};
      }
      var c = d.casa[p === 2 ? mesAtual : mesAnt];
      if (!c) return vazio('comanda + mensalidade');
      return {n: B.reais(c.total), l: 'comanda + mensalidade' + (c.parcial ? ' · parcial' : ''), t: 'solid'};
    }
    var b = B.barbeiro(d, id);
    if (p === 1) {
      var s = b && b.estatisticas && b.estatisticas.semana;
      if (!s) return vazio('comanda da semana');
      if (s.total != null) return {n: B.reais(s.total), l: 'com assinaturas (por visita)' + (s.periodo && s.periodo.parcial ? ' · parcial' : ''), t: 'dashed'};
      return {n: B.reais(s.comanda), l: 'comanda, sem mensalidade' + (s.periodo && s.periodo.parcial ? ' · parcial' : ''), t: 'solid'};
    }
    var x = d16(p === 2 ? mesAtual : mesAnt, id);
    if (!x) return vazio('comanda + mensalidade');
    return {n: B.reais(x.total), l: p === 2 ? 'estimativa · parcial' : 'estimativa · não é comissão', t: 'dashed'};
  }

  function atendimentos(p, id) {
    if (p === 0) { var u = ultimoDia(id); return u ? {n: B.inteiro(u.atendimentos), l: 'atendimentos em ' + B.ddmm(u.data)} : {n: SEM, l: 'sem dia coletado'}; }
    var w = CH[p];
    if (id === 'equipe') {
      if (p === 1) {
        var st = d.barbeiros.map(function (b) { return b.estatisticas && b.estatisticas.semana; });
        if (st.some(function (x) { return !x; })) return {n: SEM, l: 'atendimentos'};
        return {n: B.inteiro(st.reduce(function (a, x) { return a + x.atendimentos; }, 0)), l: 'atendimentos' + (st[0].periodo.parcial ? ' · parcial' : '')};
      }
      var c = d.casa[p === 2 ? mesAtual : mesAnt];
      return c ? {n: B.inteiro(c.atendimentos), l: 'atendimentos' + (c.parcial ? ' · parcial' : '')} : {n: SEM, l: 'atendimentos'};
    }
    var e = B.barbeiro(d, id), s = e && e.estatisticas && e.estatisticas[w];
    return s ? {n: B.inteiro(s.atendimentos), l: 'atendimentos · ' + s.dias_trabalhados + ' dias'} : {n: SEM, l: 'atendimentos'};
  }

  // Cartas: no período Hoje usam a semana; menos de 3 dias = oculta; nota só do placar do mês anterior.
  function cartas(p) {
    var w = p === 0 ? 'semana' : CH[p];
    var comNota = p === 3 && d.placar && d.placar.mes === mesAnt;
    var notas = comNota ? d.placar.cartas.map(function (c) { return c.overall; }) : [];
    var media = notas.length ? Math.round(notas.reduce(function (a, x) { return a + x; }, 0) / notas.length) : null;
    var lista = [['fut ' + (media != null ? B.faixa(media) : 'preta'), 'Equipe', media != null ? String(media) : '—', 'EQP', 'A CASA']];
    d.barbeiros.forEach(function (b) {
      var s = b.estatisticas && b.estatisticas[w], dias = s ? s.dias_trabalhados : 0;
      if (b.barbeiro === 'Igor') { lista.push(['fut preta', 'Igor', 'FUN', '', 'FUNDADOR']); return; }
      if (dias < 3) { lista.push(['fut oculta', b.barbeiro, '?', '', 'MENOS DE 3 DIAS']); return; }
      var c = comNota ? B.carta(d, b.barber_id) : null;
      if (c) lista.push(['fut ' + B.faixa(c.overall), b.barbeiro, String(c.overall), 'BAR', 'ATD ' + (B.atributos(c).ATD == null ? '—' : B.atributos(c).ATD)]);
      else lista.push(['fut preta', b.barbeiro, '—', 'BAR', dias + ' DIAS']);
    });
    return lista;
  }

  function agoraMin() {
    var t = new Intl.DateTimeFormat('pt-BR', {timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false}).format(new Date());
    return B.minutos(t);
  }
  function vagas(id) {
    var lista = [], agora = agoraMin(), coletado = null;
    var bs = d.barbeiros.filter(function (b) { return id === 'equipe' || b.barber_id === id; });
    var cinza = 'color: rgba(235,235,245,.62)', sem = 'display: none';
    bs.forEach(function (b) {
      var dia = b.agenda && b.agenda.filter(function (x) { return x.dia === d.hoje; })[0];
      if (!dia) { lista.push({txt: b.barbeiro + ' · sem retrato da agenda de hoje', estilo: cinza, link: sem}); return; }
      coletado = dia.coletado_em || coletado;
      if (dia.casa_fechada) { lista.push({txt: b.barbeiro + ' · casa fechada', estilo: cinza, link: sem}); return; }
      if (dia.folga) { lista.push({txt: b.barbeiro + ' · folga', estilo: cinza, link: sem}); return; }
      var livres = dia.faixas_livres.filter(function (f) { return B.minutos(f.fim) > agora; });
      if (!livres.length) { lista.push({txt: b.barbeiro + ' · sem vaga hoje', estilo: cinza, link: sem}); return; }
      var ini = B.minutos(livres[0].inicio) > agora ? livres[0].inicio : null;
      lista.push({txt: b.barbeiro + ' · ' + (ini ? B.hora(ini) : 'agora') + (livres.length > 1 ? ' e mais ' + (livres.length - 1) : ''), estilo: '', link: ''});
    });
    var hora = coletado ? new Intl.DateTimeFormat('pt-BR', {timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit'}).format(new Date(coletado)) : null;
    return {lista: lista, rot: hora ? 'hoje · retrato ' + hora : 'hoje'};
  }

  function inicial(k, opcoes, padrao) { var v = B.param(k), i = opcoes.indexOf(v); return i >= 0 ? i : padrao; }
  // Mês pedido no endereço: corrente e anterior têm janela aqui; outro mês fica na Casa, que tem a faixa de meses.
  var pedido = B.param('periodo');
  if (/^\d{4}-\d{2}$/.test(pedido) && pedido !== mesAtual && pedido !== mesAnt) { location.replace('Casa-Visao.html?periodo=' + pedido); return; }
  var periodo0 = pedido === mesAtual ? 2 : pedido === mesAnt ? 3 : inicial('periodo', CH, 0);

  class Component extends DCLogic {
    constructor(props) {
      super(props);
      // Abre em Hoje, que mostra o último dia coletado (o dia corrente entra na coleta da manhã seguinte).
      this.state = {periodo: periodo0, lente: 0, barbeiro: inicial('barbeiro', IDS, 0)};
    }
    setState(p) {
      Object.assign(this.state, p);
      var q = new URLSearchParams(location.search);
      q.set('periodo', CH[this.state.periodo]); q.set('barbeiro', IDS[this.state.barbeiro]);
      history.replaceState(null, '', '?' + q.toString());
      DCLogic.prototype.setState.call(this, {});
    }
    renderVals() {
      var s = this.state, self = this, id = IDS[s.barbeiro];
      var B5 = cartas(s.periodo), f = faturamento(s.periodo, id), a = atendimentos(s.periodo, id), v = vagas(id);
      var hoje = B.data(d.hoje), ate = d.saude && d.saude.dados_ate;
      return {
        saude: ate ? 'dados até ' + B.ddmm(ate) + (d.saude.coleta === 'ok' ? '' : ' · coleta ' + d.saude.coleta) : 'dados indisponíveis',
        data: B.DIAS[hoje.getDay()] + ' · ' + hoje.getDate() + ' de ' + B.MESES[hoje.getMonth()],
        per: P[s.periodo],
        n1: f.n, l1: f.l, t1: f.t,
        n2: 'sem meta', l2: 'meta coletiva · proposta',
        n3: a.n, l3: a.l,
        vagas: v.lista, vagasRot: v.rot,
        periodos: P.map(function (x, i) { return {label: x, cls: i === s.periodo ? 'on' : '', sel: i === s.periodo ? 'true' : 'false', pick: function () { self.setState({periodo: i}); }}; }),
        lentes: L.map(function (x, i) { return {label: x, cls: i === s.lente ? 'on' : '', sel: i === s.lente ? 'true' : 'false', pick: function () { self.setState({lente: i}); }}; }),
        barbeiros: B5.map(function (x, i) { return {cls: x[0], nome: x[1].toUpperCase(), ovr: x[2], pos: x[3], s1: x[4], rotulo: x[1] + ', carta ' + x[2], wrap: i === s.barbeiro ? 'escolha on' : 'escolha', sel: i === s.barbeiro ? 'true' : 'false', pick: function () { if (i === 0) self.setState({barbeiro: 0}); else location.href = 'Barbeiro.html?barbeiro=' + IDS[i] + '&periodo=' + CH[s.periodo]; }}; }),
        titulo: s.barbeiro === 0 ? 'Ottoni' : B5[s.barbeiro][1]
      };
    }
  }
  window.dcMontar(Component);
});
