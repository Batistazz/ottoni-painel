/* Hoje · Recepção: linha do dia montada com o retrato real da agenda (sem nomes de cliente). */
Bancada.pronto(function (d) {
  Bancada.PC.semPeriodo('A recepção mostra a agenda do dia escolhido abaixo.');
  var B = Bancada, INI = 8 * 60, FIM = 20 * 60, AGENDA = 'https://agendamentos.bestbarbers.app/barbershop/ottoni';
  var pct = function (m) { return Math.max(0, Math.min(100, (m - INI) / (FIM - INI) * 100)); };
  var dias = [];
  d.barbeiros.forEach(function (b) { (b.agenda || []).forEach(function (x) { if (dias.indexOf(x.dia) < 0) dias.push(x.dia); }); });
  dias.sort();
  // Dias em que a casa abre (alguém sem "casa fechada"), até seis botões.
  dias = dias.filter(function (dia) {
    return d.barbeiros.some(function (b) { var x = (b.agenda || []).filter(function (y) { return y.dia === dia; })[0]; return x && !x.casa_fechada; });
  }).slice(0, 6);
  var sel = B.param('dia');
  if (dias.indexOf(sel) < 0) sel = dias[0];

  var botoes = B.$$('button.dia');
  botoes.forEach(function (btn, i) {
    var dia = dias[i];
    if (!dia) { btn.style.display = 'none'; return; }
    var dt = B.data(dia);
    btn.innerHTML = B.CHAVE_DIA[dt.getDay()] + '<b>' + dt.getDate() + '</b>';
    btn.addEventListener('click', function () { sel = dia; desenhar(); });
  });
  var regua = B.$('.regua > div');
  if (regua) { var h = ''; for (var t = 8; t <= 20; t++) h += '<span>' + t + 'h</span>'; regua.innerHTML = h; }

  var linhas = B.$$('.linha'), modeloVaga = linhas[0].cloneNode(true), modeloFolga = linhas[linhas.length - 1].cloneNode(true);
  var caixa = linhas[0].parentNode, legendaAgora = null;
  B.$$('span').forEach(function (s) { if (/^agora, /.test(s.textContent.trim())) legendaAgora = s; });

  function agoraMin() {
    return B.minutos(new Intl.DateTimeFormat('pt-BR', {timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false}).format(new Date()));
  }
  function horaDe(iso) { return new Intl.DateTimeFormat('pt-BR', {timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit'}).format(new Date(iso)); }

  function desenhar() {
    botoes.forEach(function (btn, i) { var on = dias[i] === sel; btn.classList.toggle('on', on); btn.setAttribute('aria-selected', on ? 'true' : 'false'); });
    var dt = B.data(sel), hoje = sel === d.hoje, agora = agoraMin(), proxima = null, coletado = null;
    var rot = B.$('.linha-rot .rot');
    if (rot) rot.textContent = 'Recepção · ' + B.DIAS[dt.getDay()] + ', ' + dt.getDate() + ' de ' + B.MESES[dt.getMonth()];
    var tit = B.$('h1.titulo span');
    if (tit) tit.textContent = hoje ? 'hoje' : B.CHAVE_DIA[dt.getDay()] + ' ' + dt.getDate();
    B.$$('.linha').forEach(function (l) { l.remove(); });
    d.barbeiros.forEach(function (b) {
      var x = (b.agenda || []).filter(function (y) { return y.dia === sel; })[0];
      var fechado = !x || x.folga || x.casa_fechada;
      var linha = (fechado ? modeloFolga : modeloVaga).cloneNode(true);
      var quem = linha.querySelector('.quem'), trilho = linha.querySelector('.trilho');
      if (fechado) {
        quem.innerHTML = b.barbeiro + '<small>' + (!x ? 'sem retrato' : x.casa_fechada ? 'fechado' : 'folga') + '</small>';
        trilho.textContent = !x ? 'Agenda deste dia ainda não coletada.' : x.casa_fechada ? 'Casa fechada neste dia.' : 'Folga: dia sem atendimento ou com bloqueio integral.';
        caixa.appendChild(linha);
        return;
      }
      coletado = x.coletado_em || coletado;
      var html = '';
      x.ocupados.forEach(function (o) {
        var a = B.minutos(o.inicio), f = B.minutos(o.fim);
        html += '<i class="' + (o.tipo === 'bloqueio' ? 'bloq' : 'ocup') + '" style="left: ' + pct(a) + '%; width: ' + (pct(f) - pct(a)) + '%"></i>';
      });
      var livres = x.faixas_livres.filter(function (fx) { return !hoje || B.minutos(fx.fim) > agora; });
      livres.forEach(function (fx) {
        var a = B.minutos(fx.inicio), f = B.minutos(fx.fim), h = B.hora(fx.inicio);
        if (proxima == null || a < proxima.m) proxima = {m: a, h: h};
        html += '<a class="vaga" href="' + AGENDA + '" aria-label="Abrir agenda: ' + b.barbeiro + ' às ' + h + '" style="left: ' + pct(a) + '%; width: ' + (pct(f) - pct(a)) + '%">' + (f - a >= 45 ? h : '') + '</a>';
      });
      if (hoje) html += '<i class="agora" style="left: ' + pct(agora) + '%"></i>';
      trilho.innerHTML = html;
      quem.innerHTML = b.barbeiro + '<small>' + (livres.length ? livres.length + (livres.length === 1 ? ' vaga' : ' vagas') : 'sem vaga') + '</small>';
      caixa.appendChild(linha);
    });
    if (legendaAgora) legendaAgora.lastChild.nodeValue = hoje ? 'agora, ' + B.hora(horaDe(new Date().toISOString())) : 'outro dia';
    var nota = B.$('main.conteudo > p');
    if (nota) nota.textContent = 'Toque numa vaga dourada para abrir a agenda na BestBarbers. Retrato da agenda' + (coletado ? ' coletado às ' + horaDe(coletado) : '') + '; não é disponibilidade ao vivo.';
    var prim = B.$('.rodape a.prim');
    if (prim) prim.textContent = proxima ? 'Abrir agenda · próxima vaga ' + proxima.h : 'Abrir agenda';
    var q = new URLSearchParams(location.search); q.set('dia', sel); history.replaceState(null, '', '?' + q.toString());
    document.dispatchEvent(new CustomEvent('bancada:dia', {detail: sel}));
  }
  desenhar();
});

/* Quem chamar (dia escolhido) e Registro de contatos: lista nominal do servidor local (/api/reception) e gravação de
   cada resultado em /api/reception/calls, o mesmo registro do painel antigo. WhatsApp grava "abriu conversa" antes de abrir. */
(function () {
  var B = Bancada, dados = null, dia = Bancada.param('dia');
  var ROT = {abriu_conversa: 'Abriu conversa', enviei: 'Enviei', marcou: 'Marcou', nao_marcou: 'Não marcou', marcou_confirmado_agenda: 'Marcou (agenda)', veio: 'Veio'};
  var MOT = [['sem_resposta', 'Sem resposta'], ['sem_horario', 'Sem horário'], ['preco', 'Preço'], ['outro_barbeiro', 'Outro barbeiro'], ['mudou_cidade', 'Mudou de cidade'], ['nao_quer_mais', 'Não quer mais'], ['outro', 'Outro']];
  // 5531989365458 → (31) 98936-5458; outro formato fica como veio.
  function fone(t) { var m = String(t || '').replace(/\D/g, '').match(/^(?:55)?(\d{2})(\d{4,5})(\d{4})$/); return m ? '(' + m[1] + ') ' + m[2] + '-' + m[3] : t; }
  function el(tag, txt, cls) { var e = document.createElement(tag); if (txt != null) e.textContent = txt; if (cls) e.className = cls; return e; }
  function estado(t) { B.$('#qc-estado').textContent = t; }
  function gravar(c, status, motivo, texto, botao) {
    var janela = status === 'abriu_conversa' && c.whatsapp ? window.open('about:blank', '_blank') : null;
    if (botao) botao.disabled = true;
    return fetch('/api/reception/calls', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({client: c.client, status: status, motivo: motivo || null, texto: texto || ''})})
      .then(function (r) { if (!r.ok) throw new Error(r.status); })
      .then(function () {
        if (janela) { janela.opener = null; janela.location = c.whatsapp; }
        estado(motivo === 'nao_quer_mais' ? 'Salvo. Não será mais indicado até revisão.' : 'Salvo: ' + ROT[status] + (c.nome ? ' · ' + c.nome : ''));
        carregar(); carregarRefazer();
      })
      .catch(function () { if (janela) janela.close(); estado('Não salvou. Tente de novo.'); if (botao) botao.disabled = false; });
  }
  function acoes(c) {
    var box = el('div', null, 'qc-acoes');
    if (c.whatsapp) { var wa = el('a', 'WhatsApp', 'wa'); wa.href = c.whatsapp; wa.addEventListener('click', function (ev) { ev.preventDefault(); gravar(c, 'abriu_conversa', null, '', null); }); box.appendChild(wa); }
    ['enviei', 'marcou'].forEach(function (s) { var b = el('button', ROT[s]); b.type = 'button'; b.addEventListener('click', function () { gravar(c, s, null, '', b); }); box.appendChild(b); });
    var sel = el('select'); sel.setAttribute('aria-label', 'Motivo de não marcar');
    sel.appendChild(el('option', 'Não marcou: motivo…')).value = '';
    MOT.forEach(function (m) { var o = el('option', m[1]); o.value = m[0]; sel.appendChild(o); });
    var txt = el('input'); txt.placeholder = 'qual?'; txt.style.cssText = 'display:none;min-height:34px;border-radius:999px;border:.5px solid rgba(235,235,245,.25);background:rgba(255,255,255,.06);color:#F2EFE9;padding:0 10px;width:120px';
    sel.addEventListener('change', function () {
      if (!sel.value) return;
      if (sel.value === 'outro' && !txt.value.trim()) { txt.style.display = ''; txt.focus(); estado('Escreva o motivo e escolha "Outro" de novo.'); sel.value = ''; return; }
      gravar(c, 'nao_marcou', sel.value, txt.value.trim(), sel);
    });
    box.appendChild(sel); box.appendChild(txt);
    return box;
  }
  function cartao(c, extra) {
    var card = el('div', null, 'qc-card'), info = el('div');
    var nome = el('b', c.nome || 'Nome ausente na fonte'); info.appendChild(nome);
    if (c.status && ROT[c.status]) { var st = el('span', ROT[c.status] + (c.day ? ' · ' + B.ddmm(c.day) : ''), 'qc-status'); st.style.marginLeft = '8px'; info.appendChild(st); }
    info.appendChild(el('p', [fone(c.telefone) || 'sem telefone', c.grupo, c.motivo && !ROT[c.motivo] ? c.motivo : null].filter(Boolean).join(' · ')));
    if (extra) info.appendChild(el('p', extra));
    card.appendChild(info); card.appendChild(acoes(c));
    return card;
  }
  function desenhar() {
    var lista = B.$('#qc-lista'); lista.innerHTML = '';
    if (!dados) return;
    var d = dados.dias.filter(function (x) { return x.dia === dia; })[0] || dados.dias[0];
    if (!d) { estado('Sem dias na agenda coletada.'); return; }
    var total = 0;
    (d.barbeiros || []).forEach(function (b) {
      var n = (b.faixas || []).reduce(function (s, f) { return s + (f.clientes || []).length; }, 0);
      total += n;
      var sec = el('div', null, 'qc-barb'), h = el('h3', b.nome);
      h.appendChild(el('small', (b.horas == null ? '' : b.horas + ' h livres · ') + (b.status || '') + (n ? ' · ' + n + ' indicados' : '')));
      sec.appendChild(h);
      (b.faixas || []).forEach(function (f) {
        if (!(f.clientes || []).length) return;
        sec.appendChild(el('div', f.inicio + '–' + f.fim, 'qc-faixa'));
        f.clientes.forEach(function (c) { sec.appendChild(cartao(c, c.combina)); });
      });
      if (n) lista.appendChild(sec);
    });
    estado(total ? total + ' clientes indicados para ' + B.ddmm(d.dia) + ' · retrato da agenda, não é ao vivo' : 'Nenhum cliente indicado para ' + B.ddmm(d.dia) + ' (sem vaga livre ou dia passado).');
    // Registro: semana e contatos dos últimos 30 dias, com o último resultado de cada um.
    var sem = dados.semanas && dados.semanas[dados.semanas.length - 1];
    B.$('#rg-semana').textContent = sem ? 'Semana ' + B.ddmm(sem.inicio) + '–' + B.ddmm(sem.fim) + ': ' + sem.contatos + ' contatos · ' + sem.enviados + ' enviados · ' + sem.marcou + ' marcaram · ' + sem.confirmados_agenda + ' confirmados pela agenda · ' + sem.vieram + ' vieram' : 'Nenhum contato registrado ainda.';
    var rg = B.$('#rg-lista'); rg.innerHTML = '';
    var rec = dados.chamadas_recentes || [];
    if (!rec.length) rg.appendChild(el('p', 'Os contatos feitos aqui aparecem nesta lista por 30 dias, com o resultado. A coleta confirma sozinha quem marcou na agenda e quem veio.'));
    rec.forEach(function (c) { rg.appendChild(cartao(c, null)); });
  }
  function carregar() {
    return fetch('/api/reception', {cache: 'no-store'}).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { dados = j; desenhar(); })
      .catch(function () { estado('Não foi possível ler a lista da recepção.'); });
  }
  // Hora de refazer: cliente que fez um serviço de prazo (selagem, hidratação...) e já passou do intervalo típico da casa.
  var refazer = null;
  function desenharRefazer() {
    var lista = B.$('#rf-lista'); lista.innerHTML = '';
    if (!refazer) return;
    var fb = B.$('#rf-barbeiro').value, fa = B.$('#rf-acao').value, fs = B.$('#rf-servico').value;
    // Uma pessoa = um cartão, sob o barbeiro do serviço feito por último.
    var pessoas = refazer.pessoas.filter(function (x) { return (!fb || x.barber === fb) && (!fa || x.acao === fa) && (!fs || x.servicos.some(function (s) { return s.familia === fs; })); });
    var grupos = {};
    pessoas.forEach(function (x) { (grupos[x.barbeiro] = grupos[x.barbeiro] || []).push(x); });
    Object.keys(grupos).sort().forEach(function (nome) {
      var sec = el('div', null, 'qc-barb'), h = el('h3', nome); h.appendChild(el('small', grupos[nome].length + (grupos[nome].length === 1 ? ' pessoa' : ' pessoas'))); sec.appendChild(h);
      grupos[nome].forEach(function (x) {
        var txt = x.servicos.map(function (s) { return s.servico + ' há ' + s.dias + ' dias (prazo ' + s.prazo + ')' + (s.barbeiro !== x.barbeiro ? ' com ' + s.barbeiro : ''); }).join(' · ');
        var c = {client: x.client, nome: x.nome, telefone: x.telefone, whatsapp: x.whatsapp, grupo: txt,
          status: x.ultimo_contato && x.ultimo_contato.status, day: x.ultimo_contato && x.ultimo_contato.dia};
        var ultima = x.servicos[0].ultima;
        var extra = x.acao === 'oferecer no horário marcado' ? 'Tem horário em ' + B.ddmm(x.horario.dia) + ' às ' + x.horario.hora + ': oferecer no atendimento.'
          : (x.veio_depois ? 'Voltou depois (última visita ' + B.ddmm(x.ultima_visita) + ') sem refazer: oferecer no próximo atendimento.' : 'Não voltou desde ' + B.ddmm(ultima) + '.')
            + (x.horario ? ' Retrato da agenda de ' + B.ddmm(x.horario.retrato) + ' mostrava horário em ' + B.ddmm(x.horario.dia) + ' às ' + x.horario.hora + ': confira antes.' : '');
        var vezes = x.servicos[0].vezes;
        sec.appendChild(cartao(c, extra + ' Já fez ' + x.servicos[0].servico.toLowerCase() + ' ' + vezes + (vezes === 1 ? ' vez.' : ' vezes.')));
      });
      lista.appendChild(sec);
    });
    B.$('#rf-estado').textContent = pessoas.length + ' de ' + refazer.pessoas.length + ' pessoas · dados até ' + B.ddmm(refazer.retrato_ate || refazer.observado_ate);
    var pz = Object.keys(refazer.prazos).map(function (k) { var p = refazer.prazos[k]; return p.prazo == null ? p.servico + ': poucos casos, fora da lista' : p.servico + ' ' + p.prazo + ' dias' + (p.combinado ? ' (combinado)' : ''); });
    B.$('#rf-nota').textContent = 'Prazo de cada serviço = 25º percentil dos intervalos entre repetições na casa (histórico desde ago/2024; estimativa, não regra de cada cliente), ou o prazo combinado em config/prazos_servicos.json. Fica na lista até 120 dias. ' + pz.join(' · ') + '. Quem disse "não quer mais" sai da lista.';
  }
  function carregarRefazer() {
    return fetch('/api/reception/refazer', {cache: 'no-store'}).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) {
        var primeira = !refazer; refazer = j;
        if (primeira) {
          var nomes = {}, serv = {};
          j.pessoas.forEach(function (x) { nomes[x.barber] = x.barbeiro; x.servicos.forEach(function (s) { serv[s.familia] = s.servico; }); });
          Object.keys(nomes).sort(function (a, b) { return nomes[a].localeCompare(nomes[b]); }).forEach(function (id) { var o = el('option', nomes[id]); o.value = id; B.$('#rf-barbeiro').appendChild(o); });
          Object.keys(serv).sort().forEach(function (k) { var o = el('option', serv[k]); o.value = k; B.$('#rf-servico').appendChild(o); });
          var pb = B.param('barbeiro'); if (pb && nomes[pb]) B.$('#rf-barbeiro').value = pb;
          ['#rf-barbeiro', '#rf-acao', '#rf-servico'].forEach(function (s) { B.$(s).addEventListener('change', desenharRefazer); });
        }
        desenharRefazer();
      })
      .catch(function () { B.$('#rf-estado').textContent = 'Não foi possível ler a lista de refazer.'; });
  }
  document.addEventListener('bancada:dia', function (ev) { dia = ev.detail; desenhar(); });
  carregar();
  carregarRefazer();
})();
