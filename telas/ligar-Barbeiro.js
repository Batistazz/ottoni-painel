/* Relatório do barbeiro (lente Dono, PC): abre ao clicar na carta. Trabalho, clientes, retenção, assinaturas,
   metas propostas e próximos dias do barbeiro em ?barbeiro=, no período do topo. Comparação por dia trabalhado. */
Bancada.pronto(function (d) {
  var B = Bancada, b = B.barbeiro(d, B.param('barbeiro')) || B.eu(d);
  if (!b) return;
  var igor = b.barbeiro === 'Igor';
  B.$('#nome').textContent = b.barbeiro;
  document.title = 'Relatório · ' + b.barbeiro;
  var c = B.pintarCarta(d, b, B.$('.fut')), at = B.atributos(c);
  B.$$('.fut .stats span').forEach(function (s) { var k = s.lastChild.nodeValue.trim(); s.querySelector('b').textContent = at[k] == null ? '—' : at[k]; });

  function porDia(e, k) { return e && e.dias_trabalhados ? e[k] / e.dias_trabalhados : null; }
  function mesmaData(x, w) {
    if (w !== 'ultimo_dia') return true;
    var a = B.PC.bloco(b.estatisticas, w), z = B.PC.bloco(x.estatisticas, w);
    return !!(a && z && a.periodo && z.periodo && a.periodo.inicio === z.periodo.inicio);
  }
  function mediaEquipe(w, k) {
    var v = d.barbeiros.filter(function (x) { return mesmaData(x, w); }).map(function (x) { return porDia(B.PC.bloco(x.estatisticas, w), k); }).filter(function (x) { return x != null; });
    return v.length ? v.reduce(function (a, x) { return a + x; }, 0) / v.length : null;
  }
  // Parte do produto na comanda e produto por atendimento da equipe: total ÷ total, não média de médias.
  function somaEquipe(w, k) { return d.barbeiros.reduce(function (a, x) { var e = mesmaData(x, w) && B.PC.bloco(x.estatisticas, w); return a + (e && e[k] || 0); }, 0); }
  function parteEquipe(w) { var c = somaEquipe(w, 'comanda'); return c ? B.pct(somaEquipe(w, 'produto') / c * 100) : '—'; }
  function porAtendEquipe(w) { var a = somaEquipe(w, 'atendimentos'); return a ? somaEquipe(w, 'produto') / a : null; }
  function um(v) { return v == null ? '—' : v.toLocaleString('pt-BR', {maximumFractionDigits: 1}); }
  var SERV = {corte: 'Corte', barba: 'Barba', sobrancelha: 'Sobrancelha', acabamento: 'Pezinho e acabamento', selagem: 'Selagem', hidratacao: 'Hidratação', pintura: 'Pintura', relaxamento: 'Relaxamento', progressiva: 'Progressiva', luzes: 'Luzes e platinado', barboterapia: 'Barboterapia', depilacao: 'Depilação', limpeza: 'Limpeza de pele', outros: 'Outros'};
  // Parte pequena com uma casa decimal, para 1 em 343 não virar "0%".
  function parte(n, t) { if (!t) return '—'; var p = n / t * 100; return p > 0 && p < 1 ? '<1%' : B.pct(p); }
  // Do mais feito ao menos feito; "Outros" por último. Aceita {k: {vezes}} ou {k: número}.
  function ordemServicos(o) { var n = function (k) { return typeof o[k] === 'number' ? o[k] : o[k].vezes; }; return Object.keys(o).sort(function (a, c) { return (a === 'outros') - (c === 'outros') || n(c) - n(a); }); }
  function linhas(id, itens) {
    B.$('#' + id).innerHTML = '';
    itens.forEach(function (it) {
      var l = document.createElement('div'), r = document.createElement('span'), v = document.createElement('b');
      l.className = 'linha'; r.textContent = it[0]; v.textContent = it[1];
      if (it[2]) { var s = document.createElement('small'); s.textContent = it[2]; r.appendChild(s); }
      if (it[3]) v.className = it[3];
      l.appendChild(r); l.appendChild(v); B.$('#' + id).appendChild(l);
    });
  }

  B.PC.periodos(function (w) {
    var e = B.PC.bloco(b.estatisticas, w), cl = e && e.clientes, casa = B.PC.bloco(d.clientes_casa, w);
    B.$('#janela').textContent = (igor ? 'Fundador · ' : 'Barbeiro · ') + B.Celular.janela((cl && cl.periodo) || (e && e.periodo), w);
    // Período sem trabalho dele: avisa em vez de deixar só travessões.
    var vazio = B.$('#vazio');
    if (!vazio) { vazio = document.createElement('p'); vazio.id = 'vazio'; vazio.style.cssText = 'margin:0;padding:10px 16px;border-radius:14px;background:rgba(227,169,75,.12);color:#E3A94B;font-size:14px;align-self:flex-start'; B.$('#nome').parentNode.parentNode.appendChild(vazio); }
    var per = (cl && cl.periodo) || (e && e.periodo);
    var semTrabalho = !e || !e.dias_trabalhados;
    vazio.style.display = semTrabalho ? '' : 'none';
    vazio.textContent = semTrabalho ? b.barbeiro + ' não trabalhou ' + ({ultimo_dia: 'no último dia coletado', semana: 'nesta semana'}[w] || 'neste mês') + (per && per.inicio ? ' (' + B.ddmm(per.inicio) + (per.fim && per.fim !== per.inicio ? '–' + B.ddmm(per.fim) : '') + ')' : '') + '. Escolha outro período no topo ou na faixa de meses.' : '';

    // Topo: quatro números do período.
    var atdDia = porDia(e, 'atendimentos'), eqAtd = mediaEquipe(w, 'atendimentos');
    B.$('#k-atd').textContent = B.inteiro(e && e.atendimentos);
    B.$('#k-atd-s').textContent = e ? e.dias_trabalhados + ' dias · ' + um(atdDia) + ' por dia (equipe ' + um(eqAtd) + ')' : 'sem dados';
    B.$('#k-cli').textContent = B.inteiro(cl && cl.unicos);
    B.$('#k-cli-s').textContent = cl ? B.inteiro(cl.novos) + ' novos · ' + B.inteiro(cl.assinantes) + ' assinantes' : 'sem dados';
    // Retorno entre meses: o do mês escolhido; em dia/semana, o do mês corrente.
    var r30 = e && e.retencao_30d, rm = B.PC.bloco(b.estatisticas, /^mes/.test(w) ? w : 'mes');
    rm = rm && rm.clientes && rm.clientes.retorno;
    if (r30 && r30.base) {
      B.$('#k-ret').textContent = B.pct(r30.percentual_casa);
      B.$('#k-ret-s').textContent = 'em até 30 dias · com ele ' + B.pct(r30.percentual_com_ele);
    } else {
      B.$('#k-ret').textContent = rm && rm.base ? B.pct(rm.percentual_casa) : '—';
      B.$('#k-ret-s').textContent = rm && rm.base ? 'do mês anterior · com ele ' + B.pct(rm.percentual_com_ele) + (rm.parcial ? ' · parcial' : '') : 'sem base';
    }
    // Faturamento sempre com a assinatura: no mês, mensalidade rateada (D16); no dia e na semana, visitas de assinante × valor por visita.
    var temTotal = e && e.total != null, mensal = /^mes/.test(w);
    B.$('#k-fat').textContent = temTotal ? B.reais(e.total) : B.reais(e && e.comanda);
    // Comanda = serviços + produtos vendidos por ele (sem mensalidade); a divisão fica à vista.
    // D23: compra de barbeiro da casa está na comanda, mas não é produto vendido nem serviço: aparece à parte.
    var prod = e && e.produto, eq = e && e.produto_detalhe && e.produto_detalhe.compra_propria ? e.produto_detalhe.compra_propria.valor : 0;
    var serv = e && e.comanda != null && prod != null ? e.comanda - prod - eq : null;
    B.$('#k-fat-s').textContent = temTotal ? 'estimativa · serviços ' + B.reais(serv) + ' + produtos ' + B.reais(prod) + ' + assinaturas ' + B.reais(e.mensalidade) + (mensal ? (w === 'mes' ? ' (mensalidade rateada, mês em andamento)' : e.periodo && e.periodo.parcial ? ' (mensalidade rateada; ainda há ciclos de mensalidade em aberto)' : ' (mensalidade rateada)') : ' (' + B.inteiro(e.atendimentos_assinante) + ' visitas de assinante)')
      : e ? 'serviços ' + B.reais(serv) + ' + produtos ' + B.reais(prod) + (eq ? ' + consumo da equipe ' + B.reais(eq) : '') + ' · sem mensalidade' : 'sem dados';
    B.$('#k-fat-s').className = temTotal ? 'estim' : '';

    // Tempo parado por dia trabalhado: horário da casa menos bloqueios menos atendimento finalizado.
    function horas(min) { return min == null ? '—' : (min / 60).toLocaleString('pt-BR', {maximumFractionDigits: 1}) + ' h'; }
    var tp = e && e.tempo_parado, eqTp = d.barbeiros.filter(function (x) { return mesmaData(x, w); }).map(function (x) { var z = B.PC.bloco(x.estatisticas, w); return z && z.tempo_parado && z.tempo_parado.dias ? z.tempo_parado.parado_min / z.tempo_parado.dias : null; }).filter(function (x) { return x != null; });
    var eqParado = eqTp.length ? eqTp.reduce(function (a, x) { return a + x; }, 0) / eqTp.length : null;
    var rg = d.clientes_casa && d.clientes_casa.regua;
    B.regua(B.$('#regua'), e, rg, true);
    B.$('#regua-nota').textContent = rg ? 'Mínimo ' + rg.minimo_pct + '% e bônus a partir de ' + rg.bonus_pct + '% da capacidade: proposta do sistema, ainda não aprovada.' : '';
    linhas('trabalho', [
      ['Dias trabalhados', B.inteiro(e && e.dias_trabalhados)],
      ['Tempo parado por dia', tp && tp.dias ? horas(tp.parado_min / tp.dias) : '—', tp && tp.aberto_min ? B.pct(tp.parado_min / tp.aberto_min * 100) + ' do horário aberto · equipe ' + horas(eqParado) : 'sem dados'],
      ['Atendimentos por dia', um(atdDia), 'equipe ' + um(eqAtd)],
      ['De assinante', e && e.atendimentos ? B.pct(e.atendimentos_assinante / e.atendimentos * 100) : '—', 'dos atendimentos'],
      ['Comanda por dia', B.reais(porDia(e, 'comanda')), 'equipe ' + B.reais(mediaEquipe(w, 'comanda'))],
      ['Produtos por dia', B.reais(porDia(e, 'produto')), 'equipe ' + B.reais(mediaEquipe(w, 'produto'))],
      ['Produtos na comanda', e && e.comanda ? B.pct(e.produto / e.comanda * 100) : '—', 'equipe ' + parteEquipe(w)],
      ['Produtos por atendimento', e && e.atendimentos ? B.reais(e.produto / e.atendimentos) : '—', 'equipe ' + B.reais(porAtendEquipe(w))]
    ]);

    // Parte dele no total da casa, por extenso: "27% dos 444 da casa".
    function daCasa(k) { return cl && casa && casa[k] ? B.pct(cl[k] / casa[k] * 100) + ' dos ' + B.inteiro(casa[k]) + ' da casa' : ''; }
    linhas('clientes', [
      ['Pessoas atendidas', B.inteiro(cl && cl.unicos), daCasa('unicos')],
      ['Novos na casa', B.inteiro(cl && cl.novos), daCasa('novos')],
      ['Assinantes', B.inteiro(cl && cl.assinantes), daCasa('assinantes')],
      ['Avulsos', B.inteiro(cl && cl.avulsos), daCasa('avulsos')]
    ]);

    var ass = e && e.assinaturas, ret = [];
    if (rm && rm.base) ret.push(['Voltaram à casa', B.pct(rm.percentual_casa), B.inteiro(rm.voltaram_casa) + ' de ' + B.inteiro(rm.base) + ' do mês anterior'],
      ['Voltaram com ele', B.pct(rm.percentual_com_ele), B.inteiro(rm.voltaram_com_ele) + ' pessoas']);
    if (r30 && r30.base) ret.push(['Voltam em até 30 dias', B.pct(r30.percentual_casa), 'com ele ' + B.pct(r30.percentual_com_ele) + (r30.em_aberto ? ' · ' + B.inteiro(r30.em_aberto) + ' em aberto' : '')]);
    else if (r30 && r30.em_aberto) ret.push(['Voltam em até 30 dias', '—', 'em aberto: ' + B.inteiro(r30.em_aberto) + ' pessoas ainda sem 30 dias']);
    if (ass) ret.push(['Assinantes ativos', B.inteiro(ass.ativos)], ['Assinaturas novas', B.inteiro(ass.novas)],
      ['Não renovaram', B.inteiro(ass.nao_renovaram), ass.a_vencer ? B.inteiro(ass.a_vencer) + ' a vencer' : ''],
      ['Mensalidades pagas', B.inteiro(ass.mensalidades_pagas), 'pagamentos dos assinantes dele'],
      ['Mensalidade rateada', B.reais(ass.mensalidades_valor), 'estimativa D16', 'estim']);
    else ret.push(['Assinaturas', 'em cálculo', 'ativos, novas e não renovaram']);
    linhas('retencao', ret);

    // Produtos: a fonte não traz quantidade; conta-se quantas vezes cada produto saiu.
    var pd = e && e.produto_detalhe, pc = casa && casa.produto_detalhe, pr = [];
    if (pd) {
      pr.push(['Atendimentos com produto', B.pct(pd.percentual_atendimentos_com_produto, 1), B.inteiro(pd.atendimentos_com_produto) + ' de ' + B.inteiro(pd.atendimentos) + (pc ? ' · casa ' + B.pct(pc.percentual_atendimentos_com_produto, 1) : '')]);
      if (pd.venda_avulsa && pd.venda_avulsa.quantidade) pr.push(['Venda no balcão', B.reais(pd.venda_avulsa.valor), B.inteiro(pd.venda_avulsa.quantidade) + ' sem atendimento']);
      (pd.top_produtos || []).forEach(function (t) { pr.push([t.nome.trim(), B.reais(t.valor), B.inteiro((t.quantidade || 0) + (t.itens_sem_quantidade || 0)) + 'x']); });
    } else pr.push(['Produtos', '—', 'sem dados no período']);
    linhas('produtos', pr);
    var rgp = d.clientes_casa && d.clientes_casa.regua;
    B.reguaProduto(B.$('#regua-produto'), e, rgp, true);
    B.$('#regua-produto-nota').textContent = rgp ? 'Meta geral de produtos da casa: mínimo ' + B.reais(rgp.produto_mes_minimo) + ' e bônus a partir de ' + B.reais(rgp.produto_mes_bonus) + ' no mês, divididos por dia trabalhado da equipe. Proposta, ainda não aprovada.' : '';

    // Serviços: vezes no período, parte dos atendimentos dele e a mesma parte na equipe (total ÷ total).
    var sv = e && e.servicos, sl = [];
    if (sv && sv.atendimentos) {
      var eqAt = somaEquipe(w, 'atendimentos');
      // Os cinco mais feitos com detalhe; o resto numa linha só.
      var ord = ordemServicos(sv.familias), resto = ord.slice(5);
      ord.slice(0, 5).forEach(function (k) {
        var f = sv.familias[k], eqF = d.barbeiros.reduce(function (a, x) { var z = mesmaData(x, w) && B.PC.bloco(x.estatisticas, w); return a + (z && z.servicos && z.servicos.familias[k] ? z.servicos.familias[k].vezes : 0); }, 0);
        sl.push([SERV[k] || k, B.inteiro(f.vezes), parte(f.vezes, sv.atendimentos) + ' dos atendimentos · equipe ' + parte(eqF, eqAt) + (f.plano ? ' · ' + B.inteiro(f.plano) + ' do plano' : '')]);
      });
      if (resto.length) sl.push(['Outros', B.inteiro(resto.reduce(function (s, k) { return s + sv.familias[k].vezes; }, 0)), resto.map(function (k) { return (SERV[k] || k).toLowerCase() + ' ' + sv.familias[k].vezes; }).join(' · ')]);
    } else sl.push(['Serviços', '—', 'sem atendimentos no período']);
    linhas('servicos', sl);
    B.$('#servicos-nota').textContent = sv && sv.atendimentos ? 'Vezes em que o serviço saiu num atendimento finalizado. "Corte + barba" conta nas duas linhas; "do plano" = atendimento de assinante.' : '';
    B.$('#produtos-nota').textContent = pd ? 'Mais vendidos por valor. "x" = vezes que saiu (a fonte não informa quantidade).' + (pd.compra_propria && pd.compra_propria.quantidade ? ' Fora da conta: consumo da equipe, ' + B.inteiro(pd.compra_propria.quantidade) + (pd.compra_propria.quantidade === 1 ? ' compra' : ' compras') + ' (' + B.reais(pd.compra_propria.valor) + ').' : '') : '';
  }, B.PC.padrao(d), Object.keys(d.casa).sort());

  // Mês a mês por serviço: um gráfico só (ele × média da equipe, por dia trabalhado) e a escolha do serviço acima.
  var meses = Object.keys(b.por_mes || {}).sort(), soma = {};
  meses.forEach(function (m) { var s = b.por_mes[m].servicos; if (s) Object.keys(s.familias).forEach(function (k) { if (k !== 'outros') soma[k] = (soma[k] || 0) + s.familias[k].vezes; }); });
  var escolhas = ordemServicos(soma).slice(0, 5), caixa = B.$('#sv-escolha');
  function vezes(m, k) { var f = m.servicos && m.servicos.familias[k]; return f ? f.vezes : 0; }
  function mostrarServico(k) {
    B.$$('#sv-escolha button').forEach(function (bt) { var on = bt.getAttribute('data-k') === k; bt.className = on ? 'on' : ''; bt.setAttribute('aria-checked', on ? 'true' : 'false'); });
    var alvo = B.$('#g-serv'); alvo.innerHTML = '';
    grafico(alvo, serie(function (m) { return vezes(m, k) / m.dias_trabalhados; }, true), um, 'por dia trabalhado · * mês parcial');
    B.$('#sv-meses').textContent = (SERV[k] || k) + ' no mês: ' + meses.map(function (m) { return B.mesCurto(m) + (m >= d.hoje.slice(0, 7) ? '*' : '') + ' ' + B.inteiro(vezes(b.por_mes[m], k)); }).join(' · ');
  }
  escolhas.forEach(function (k) {
    var bt = document.createElement('button'); bt.type = 'button'; bt.setAttribute('role', 'radio'); bt.setAttribute('data-k', k); bt.textContent = SERV[k] || k;
    bt.addEventListener('click', function () { mostrarServico(k); }); caixa.appendChild(bt);
  });

  // Clientes novos de cada mês (primeira visita na casa) e quantos voltaram em até 60 dias.
  var nv = [];
  meses.forEach(function (m) {
    var n = b.por_mes[m].novos_60d; if (!n || !n.novos) return;
    if (n.base) nv.push([B.mesNome(m), B.pct(n.percentual_casa), B.inteiro(n.voltaram_casa) + ' de ' + B.inteiro(n.base) + ' voltaram · com ele ' + B.pct(n.percentual_com_ele) + (n.em_aberto ? ' · ' + B.inteiro(n.em_aberto) + ' em aberto' : '')]);
    else nv.push([B.mesNome(m), '—', B.inteiro(n.novos) + ' novos, ainda sem 60 dias']);
  });
  if (!nv.length) nv.push(['Clientes novos', '—', 'nenhum no painel']);
  linhas('novos60', nv);
  B.$('#novos60-nota').textContent = 'Novo = primeira visita na casa em todo o histórico, contado no mês da primeira visita com ele. "Em aberto" = ainda não completou 60 dias. Poucos clientes por mês: diferença pequena pode ser acaso.';

  // Hora de refazer: resumo da lista local da recepção, só deste barbeiro.
  fetch('/api/reception/refazer?barbeiro=' + encodeURIComponent(b.barber_id), {cache: 'no-store'}).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (j) {
      var porAcao = {}, porServ = {};
      j.pessoas.forEach(function (x) { porAcao[x.acao] = (porAcao[x.acao] || 0) + 1; x.servicos.forEach(function (s) { porServ[s.servico] = (porServ[s.servico] || 0) + 1; }); });
      linhas('refazer', [['Mandar mensagem', B.inteiro(porAcao['mandar mensagem'] || 0), 'não voltaram desde o serviço'],
        ['Oferecer no horário marcado', B.inteiro(porAcao['oferecer no horário marcado'] || 0), 'já têm horário'],
        ['Oferecer no próximo atendimento', B.inteiro(porAcao['oferecer no próximo atendimento'] || 0), 'voltaram sem refazer']]
        .concat(Object.keys(porServ).sort(function (a, c) { return porServ[c] - porServ[a]; }).map(function (s) { return [s, B.inteiro(porServ[s]), 'pessoas com este serviço vencido']; })));
      var nota = B.$('#refazer-nota'); nota.textContent = B.inteiro(j.pessoas.length) + ' pessoas; quem tem dois serviços vencidos aparece nas duas linhas de serviço. ';
      var a = document.createElement('a'); a.href = 'Hoje-Recepcao.html?barbeiro=' + encodeURIComponent(b.barber_id) + '#refazer'; a.textContent = 'Abrir a lista com WhatsApp'; nota.appendChild(a);
    })
    .catch(function () { B.$('#refazer-nota').textContent = 'Na demonstração a lista não aparece: ela tem nome e telefone dos clientes e só abre no computador da barbearia.'; });

  // Metas propostas por dia da escala (comanda, R$), com a parte dos dias em que foram alcançadas.
  var m = b.metas, prox = B.metaDoDia(b, d.hoje);
  if (m && m.dias_da_escala) {
    m.dias_da_escala.forEach(function (k) {
      var ROT = {valor_comandas: 'comanda', produtos: 'produto', atendimentos: 'atendimentos', servico_extra: 'serviço extra'};
      var s = document.createElement('span'), v = document.createElement('b');
      s.className = prox && prox.dia === k ? 'hoje' : '';
      v.textContent = k; s.appendChild(v);
      var lista = (m[k] || []).map(function (x) {
        var reais = x.metrica === 'valor_comandas' || x.metrica === 'produtos';
        return ROT[x.metrica] + ' ' + (reais ? B.reais(x.meta_proposta) : B.inteiro(x.meta_proposta)) + ' (' + Math.round(x.bateu_pct) + '%)';
      });
      s.appendChild(document.createTextNode(lista.length ? lista.join(' · ') : 'sem meta'));
      B.$('#metas').appendChild(s);
    });
    B.$('#metas-nota').textContent = 'Entre parênteses, a parte dos dias em que ele alcançou o valor. Comanda sem mensalidade; produto em reais. Proposta do sistema; contorno dourado: próximo dia dele.';
  } else B.$('#metas-nota').textContent = 'Sem metas propostas.';

  // Próximos 7 dias da agenda: horas livres pelo retrato da agenda.
  var dias = (b.agenda || []).filter(function (x) { return x.dia >= d.hoje; }).slice(0, 7);
  dias.forEach(function (x) {
    var el = document.createElement('div'), dt = B.data(x.dia), v = document.createElement('b');
    el.textContent = B.CHAVE_DIA[dt.getDay()] + ' ' + B.ddmm(x.dia);
    v.textContent = x.casa_fechada ? 'fechado' : x.folga ? 'folga' : x.horas_livres == null ? '—' : um(x.horas_livres) + 'h';
    el.appendChild(v); B.$('#dias').appendChild(el);
  });
  B.$('#dias-nota').textContent = dias.length ? 'Retrato da agenda; não é disponibilidade ao vivo.' : 'Sem retrato da agenda futura.';
  // Voltar: para a tela de onde veio (mesmo painel); aberto direto, vai ao Início no mesmo período.
  var voltar = B.$('#voltar');
  voltar.setAttribute('href', 'Main.html?periodo=' + (B.param('periodo') || 'mes'));
  voltar.addEventListener('click', function (ev) {
    if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) { ev.preventDefault(); history.back(); }
  });

  // Mês a mês (jul em diante): ele em dourado contra a média da equipe em cinza tracejado.
  // Parcial: no faturamento, D16 (ciclos de mensalidade abertos); nos atendimentos, só o mês corrente.
  // Por dia trabalhado (regra B), a partir de por_mes de cada barbeiro: a mesma base dos números da tela.
  function serie(f, soCorrente) {
    return Object.keys(d.casa).sort().map(function (ym) {
      var lista = d.barbeiros.map(function (x) { var m = x.por_mes && x.por_mes[ym]; return m && m.dias_trabalhados ? {id: x.barber_id, v: f(m)} : null; })
        .filter(function (x) { return x && x.v != null; });
      var ele = lista.filter(function (x) { return x.id === b.barber_id; })[0], d16 = d.d16[ym];
      return {ym: ym, parcial: soCorrente ? ym >= d.hoje.slice(0, 7) : !d16 || d16.periodo.status === 'parcial', ele: ele ? ele.v : null, eq: lista.length ? lista.reduce(function (a, x) { return a + x.v; }, 0) / lista.length : null};
    });
  }
  function grafico(alvo, pts, fmt, nota) {
    var W = 520, H = 170, E = 44, Dm = 70, T = 14, Bx = 26, NS = 'http://www.w3.org/2000/svg';
    var max = Math.max.apply(null, pts.map(function (p) { return Math.max(p.ele || 0, p.eq || 0); }).concat([1])) * 1.15;
    var x = function (i) { return E + (pts.length < 2 ? 0 : i * (W - E - Dm) / (pts.length - 1)); }, y = function (v) { return T + (H - T - Bx) * (1 - v / max); };
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', pts.map(function (p) { return B.mesNome(p.ym) + ': ' + b.barbeiro + ' ' + (p.ele == null ? 'sem dado' : fmt(p.ele)) + ', equipe ' + fmt(p.eq); }).join('; '));
    function el(tag, at) { var n = document.createElementNS(NS, tag); for (var k in at) n.setAttribute(k, at[k]); svg.appendChild(n); return n; }
    [0, .5, 1].forEach(function (f) {
      var v = max / 1.15 * f;
      el('line', {x1: E, x2: W - Dm, y1: y(v), y2: y(v), stroke: 'rgba(235,235,245,.10)', 'stroke-width': 1});
      el('text', {x: E - 8, y: y(v) + 4, 'text-anchor': 'end', fill: 'rgba(235,235,245,.62)', 'font-size': 11}).textContent = fmt(v);
    });
    pts.forEach(function (p, i) {
      el('text', {x: x(i), y: H - 6, 'text-anchor': 'middle', fill: 'rgba(235,235,245,.6)', 'font-size': 11}).textContent = B.mesCurto(p.ym) + (p.parcial ? '*' : '');
    });
    function linha(k, cor, larg, traco) {
      var d2 = pts.map(function (p, i) { return p[k] == null ? null : (x(i) + ',' + y(p[k])); }).filter(Boolean);
      if (d2.length > 1) el('polyline', {points: d2.join(' '), fill: 'none', stroke: cor, 'stroke-width': larg, 'stroke-dasharray': traco || '', 'stroke-linejoin': 'round', 'stroke-linecap': 'round'});
    }
    linha('eq', '#8E8E93', 1.5, '5 4');
    linha('ele', '#E9CE7A', 2);
    pts.forEach(function (p, i) {
      if (p.ele != null) el('circle', {cx: x(i), cy: y(p.ele), r: 4, fill: '#E9CE7A', stroke: '#141416', 'stroke-width': 2});
    });
    // Rótulos diretos no último ponto.
    var u = pts[pts.length - 1], ux = x(pts.length - 1) + 10;
    var ye = u.ele != null ? y(u.ele) : null, yq = u.eq != null ? y(u.eq) : null;
    if (ye != null && yq != null && Math.abs(ye - yq) < 14) { var meio = (ye + yq) / 2, cima = ye <= yq; ye = meio + (cima ? -7 : 7); yq = meio + (cima ? 7 : -7); }
    if (ye != null) el('text', {x: ux, y: ye + 4, fill: '#F2EFE9', 'font-size': 12, 'font-weight': 600}).textContent = b.barbeiro;
    if (yq != null) el('text', {x: ux, y: yq + 4, fill: 'rgba(235,235,245,.65)', 'font-size': 12}).textContent = 'Equipe';
    alvo.appendChild(svg);
    // Dica ao passar o mouse: alvo da largura do mês inteiro.
    var dica = document.createElement('div'); dica.className = 'dica'; alvo.appendChild(dica);
    var passo = pts.length < 2 ? W : (W - E - Dm) / (pts.length - 1);
    pts.forEach(function (p, i) {
      var r = el('rect', {x: x(i) - passo / 2, y: 0, width: passo, height: H, fill: 'transparent'});
      r.addEventListener('mouseenter', function () {
        dica.textContent = '';
        [B.mesNome(p.ym) + (p.parcial ? ' (parcial)' : ''), b.barbeiro + ': ' + (p.ele == null ? 'sem dado' : fmt(p.ele)), 'Equipe: ' + fmt(p.eq)].forEach(function (t, j) {
          var l = document.createElement('div'); l.textContent = t; if (!j) l.style.fontWeight = '600'; dica.appendChild(l);
        });
        var caixa = svg.getBoundingClientRect(), esc = caixa.width / W;
        dica.style.display = 'block';
        dica.style.left = Math.min(x(i) * esc + 12, caixa.width - dica.offsetWidth) + 'px';
        dica.style.top = '8px';
      });
      r.addEventListener('mouseleave', function () { dica.style.display = 'none'; });
    });
    var leg = document.createElement('div'); leg.className = 'leg';
    leg.innerHTML = '<span><i style="border-top: 2px solid #E9CE7A"></i></span><span><i style="border-top: 2px dashed #8E8E93"></i>média da equipe</span>';
    leg.firstChild.appendChild(document.createTextNode(b.barbeiro));
    var n = document.createElement('span'); n.textContent = nota; leg.appendChild(n);
    alvo.appendChild(leg);
  }
  var um1 = function (v) { return v == null ? '—' : v.toLocaleString('pt-BR', {maximumFractionDigits: 1}); };
  grafico(B.$('#g-atd'), serie(function (m) { return m.atendimentos / m.dias_trabalhados; }, true), um1, 'por dia trabalhado · * mês parcial');
  grafico(B.$('#g-fat'), serie(function (m) { return m.total == null ? null : m.total / m.dias_trabalhados; }), B.reais, 'estimativa D16 · por dia trabalhado · * mês parcial');
  if (escolhas.length) mostrarServico(escolhas[0]);

  B.$('#nota').textContent = 'Clientes são pessoas, não atendimentos. Comparação com a equipe por dia trabalhado. Faturamento por barbeiro com mensalidade é estimativa (D16) e não serve para comissão.';
});
