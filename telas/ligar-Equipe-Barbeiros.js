/* Equipe · Barbeiros lado a lado no período do topo: trabalho, clientes, assinaturas, retenção e produto,
   por dia trabalhado; última linha = a casa. Clique na linha abre o relatório. Total com mensalidade só no mês fechado (D16). */
Bancada.pronto(function (d) {
  var B = Bancada, corpo = B.$('#linhas'), gaveta = B.$('#metodo');
  function porDia(e, k) { return e && e.dias_trabalhados ? e[k] / e.dias_trabalhados : null; }
  function um(v) { return v == null ? '—' : v.toLocaleString('pt-BR', {maximumFractionDigits: 1}); }
  function celula(tr, valor, nota, classe) {
    var td = document.createElement('td'), b = document.createElement('b');
    b.textContent = valor; if (classe) b.className = classe; td.appendChild(b);
    if (nota) { var s = document.createElement('small'); s.textContent = nota; td.appendChild(s); }
    tr.appendChild(td);
  }
  // Volta à casa: em até 30 dias quando há base madura; senão, de um mês para o outro.
  function volta(r30, rm) {
    if (r30 && r30.base) return [B.pct(r30.percentual_casa), 'em 30 dias'];
    if (rm && rm.base) return [B.pct(rm.percentual_casa), 'mês seguinte'];
    return ['—', ''];
  }
  B.PC.periodos(function (w, p) {
    corpo.innerHTML = '';
    var mesRet = /^mes/.test(w) ? w : 'mes', primeiro = null;
    d.barbeiros.forEach(function (b) {
      // No Hoje, só a data da casa: quem trabalhou em outro dia fica sem dado, com a data dele à vista.
      var e = B.PC.bloco(b.estatisticas, w), refC = w === 'ultimo_dia' && d.clientes_casa && d.clientes_casa.ultimo_dia && d.clientes_casa.ultimo_dia.periodo, outro = refC && e && e.periodo && e.periodo.inicio !== refC.inicio ? e.periodo.inicio : null;
      if (outro) e = null;
      var cl = e && e.clientes, a = e && e.assinaturas;
      var bm = B.PC.bloco(b.estatisticas, mesRet), rm = bm && bm.clientes && bm.clientes.retorno;
      primeiro = primeiro || (e && (cl && cl.periodo || e.periodo));
      var tr = document.createElement('tr'), td = document.createElement('td'), nome = document.createElement('span');
      nome.className = 'nome'; nome.textContent = b.barbeiro;
      var img = document.createElement('img'); img.alt = ''; img.src = 'fotos/' + b.barber_id + '.jpg'; img.onerror = function () { img.remove(); };
      nome.insertBefore(img, nome.firstChild); td.appendChild(nome); if (outro) { var sm = document.createElement('small'); sm.textContent = 'último dia ' + B.ddmm(outro); sm.style.cssText = 'display:block;font-size:11px;color:rgba(235,235,245,.62)'; td.appendChild(sm); } tr.appendChild(td);
      celula(tr, B.inteiro(e && e.dias_trabalhados));
      celula(tr, um(porDia(e, 'atendimentos')), e ? B.inteiro(e.atendimentos) + ' no total' : '');
      celula(tr, B.inteiro(cl && cl.unicos), cl ? B.inteiro(cl.assinantes) + ' assinantes' : '');
      celula(tr, B.inteiro(cl && cl.novos));
      celula(tr, B.inteiro(a && a.ativos), a ? B.inteiro(a.novas) + ' assinaram' : '');
      celula(tr, B.inteiro(a && a.nao_renovaram), a && a.a_vencer ? B.inteiro(a.a_vencer) + ' a vencer' : '');
      var v = volta(e && e.retencao_30d, rm); celula(tr, v[0], v[1]);
      celula(tr, B.reais(porDia(e, 'comanda')));
      celula(tr, B.reais(porDia(e, 'produto')), e && e.comanda ? B.pct(e.produto / e.comanda * 100) + ' da comanda' : '');
      var temTotal = e && e.total != null;
      celula(tr, temTotal ? B.reais(e.total) : '—', temTotal ? 'com assinatura' + (/^mes/.test(w) ? '' : ' (por visita)') : 'sem dado', temTotal ? 'estim' : '');
      tr.title = 'Abrir o relatório do ' + b.barbeiro;
      tr.addEventListener('click', function () { location.href = 'Barbeiro.html?barbeiro=' + b.barber_id + '&periodo=' + p; });
      corpo.appendChild(tr);
    });
    // A casa: pessoas deduplicadas (não é a soma das linhas); por dia = média da equipe.
    var c = B.PC.bloco(d.clientes_casa, w), ca = c && c.assinaturas, cm = B.PC.bloco(d.clientes_casa, mesRet), rmc = cm && cm.retorno;
    var med = function (k) { var v = d.barbeiros.map(function (b) { return porDia(B.PC.bloco(b.estatisticas, w), k); }).filter(function (x) { return x != null; }); return v.length ? v.reduce(function (s, x) { return s + x; }, 0) / v.length : null; };
    var tr = document.createElement('tr'); tr.className = 'equipe'; tr.style.cursor = 'default';
    var td = document.createElement('td'); td.innerHTML = '<span class="nome">Casa</span>'; tr.appendChild(td);
    celula(tr, '—');
    celula(tr, um(med('atendimentos')), 'média da equipe');
    celula(tr, B.inteiro(c && c.unicos), c ? B.inteiro(c.assinantes) + ' assinantes' : '');
    celula(tr, B.inteiro(c && c.novos));
    celula(tr, B.inteiro(ca && ca.ativos), ca ? B.inteiro(ca.novas) + ' assinaram' : '');
    celula(tr, B.inteiro(ca && ca.nao_renovaram), ca && ca.a_vencer ? B.inteiro(ca.a_vencer) + ' a vencer' : '');
    var vc = volta(c && c.retencao_30d, rmc); celula(tr, vc[0], vc[1]);
    celula(tr, B.reais(med('comanda')), 'média da equipe');
    celula(tr, B.reais(med('produto')), 'média da equipe');
    celula(tr, '—');
    corpo.appendChild(tr);
    B.$('#janela').textContent = 'Equipe · ' + B.Celular.janela(primeiro, w);
    document.dispatchEvent(new CustomEvent('bancada:periodo', {detail: w}));
    B.$('#rodape-tab').textContent = 'Clientes são pessoas; a linha da casa não é a soma das linhas, porque uma pessoa passa por mais de um barbeiro. "Por dia" = por dia trabalhado. Clique num barbeiro para abrir o relatório dele.';
  }, B.PC.padrao(d), Object.keys(d.casa).sort());

  // Gaveta do método (D16): abre pelo link e fecha no X; texto com os dias do último mês fechado.
  var meses = Object.keys(d.d16).sort().filter(function (m) { return m < d.hoje.slice(0, 7); }), mes = meses[meses.length - 1];
  if (mes) {
    var lista = d.d16[mes].barbeiros, p = gaveta.querySelector('p');
    p.lastChild.nodeValue = ' O total muda com a escala. Dias com atendimento em ' + B.mesNome(mes) + ': ' +
      lista.map(function (x) { return x.barbeiro + ' ' + x.dias_com_atendimento; }).join(', ') + '. Por dia: ' +
      lista.map(function (x) { return x.barbeiro + ' ' + B.reais(x.total / x.dias_com_atendimento); }).join(', ') + '.';
  }
  B.$('#abrir-metodo').addEventListener('click', function (ev) { ev.preventDefault(); gaveta.style.display = 'flex'; });
  gaveta.querySelector('button[aria-label="Fechar a Gaveta"]').addEventListener('click', function () { gaveta.style.display = 'none'; });
});
