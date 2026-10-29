/* Casa · Fonte: saúde real da coleta e os últimos 14 dias. Divergências seguem o registro do projeto. */
Bancada.pronto(function (d) {
  Bancada.PC.semPeriodo('A saúde dos dados não muda com o período.');
  var B = Bancada, s = d.saude || {};
  var hora = function (iso) { return new Intl.DateTimeFormat('pt-BR', {timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'}).format(new Date(iso)); };

  // Estado atual em destaque; os outros dois ficam apagados.
  var estados = B.$$('.est'), atual = s.coleta === 'ok' ? 0 : /bloq|sess|login/.test(s.coleta || '') ? 2 : 1;
  estados.forEach(function (e, i) { e.style.opacity = i === atual ? '1' : '.6'; });

  var paineis = B.$$('section.vidro.painel');
  if (s.ultima_atualizacao) {
    var ult = paineis[0].children[1];
    ult.textContent = B.ddmm(s.ultima_atualizacao.slice(0, 10));
    paineis[0].querySelector('p').textContent = 'Atualizado em ' + hora(s.ultima_atualizacao) + '; dados fechados até ' + B.ddmm(s.dados_ate) + '. Coleta: ' + s.coleta + '.';
  }

  // Dias com dado: união dos dias publicados por barbeiro.
  var comDado = {}, trabalhou = {};
  d.barbeiros.forEach(function (b) { b.dias.forEach(function (x) { comDado[x.data] = true; if (x.trabalhado) trabalhou[x.data] = true; }); });
  var datas = Object.keys(comDado).sort();
  if (datas.length) {
    var origem = paineis[2].querySelectorAll('.item')[0].children;
    origem[0].textContent = datas.length + 'd';
    origem[1].textContent = 'coleta diária, ' + B.ddmm(datas[0]) + ' a ' + B.ddmm(datas[datas.length - 1]);
  }

  var tira = paineis[3].querySelector('[role="img"]'), celulas = tira.children, fim = B.data(d.hoje), falta = [], ok = [];
  for (var i = 0; i < celulas.length; i++) {
    var dt = new Date(fim); dt.setDate(fim.getDate() - (celulas.length - 1 - i));
    var iso = B.iso(dt), bola = celulas[i].children[0], spans = celulas[i].querySelectorAll('span');
    spans[0].textContent = dt.getDate(); spans[1].textContent = B.CHAVE_DIA[dt.getDay()];
    if (iso > s.dados_ate || !comDado[iso]) {
      bola.style.cssText = 'width: 14px; height: 14px; border-radius: 50%; border: 1.5px dashed rgba(235,235,245,.45); box-sizing: border-box';
      spans[0].style.color = 'rgba(235,235,245,.62)'; falta.push(dt.getDate());
    } else if (!trabalhou[iso]) {
      bola.style.cssText = 'width: 14px; height: 14px; border-radius: 50%; background: rgba(99,192,142,.35)';
      spans[0].style.color = 'rgba(235,235,245,.75)'; ok.push(dt.getDate());
    } else {
      bola.style.cssText = 'width: 14px; height: 14px; border-radius: 50%; background: #63C08E; box-shadow: 0 0 10px rgba(99,192,142,.8)';
      spans[0].style.color = 'rgba(235,235,245,.75)'; ok.push(dt.getDate());
    }
  }
  tira.setAttribute('aria-label', ok.length + ' dias coletados; ' + (falta.length ? 'faltam ' + falta.join(', ') : 'nenhum faltando'));
});

/* Atualizar dados: roda a mesma atualização do atalho "Barbearia - Atualizar" (coleta + nuvem), com a trava do coletor.
   Mostra o andamento e recarrega a tela quando termina. */
Bancada.pronto(function () {
  var B = Bancada, bt = B.$$('button').filter(function (x) { return /Atualizar dados/.test(x.textContent); })[0];
  if (!bt) return;
  bt.disabled = false;
  bt.style.cssText += ';cursor:pointer;border-style:solid';
  bt.textContent = 'Atualizar dados';
  function acompanhar() {
    fetch('/api/bancada/atualizar', {cache: 'no-store'}).then(function (r) { return r.json(); }).then(function (s) {
      if (s.rodando) { bt.textContent = 'Coletando… pode levar alguns minutos'; setTimeout(acompanhar, 5000); return; }
      bt.textContent = 'Atualizado · recarregando';
      bt.title = s.ultimas_linhas || '';
      setTimeout(function () { location.reload(); }, 1500);
    }).catch(function () { setTimeout(acompanhar, 5000); });
  }
  bt.addEventListener('click', function () {
    bt.textContent = 'Iniciando…';
    fetch('/api/bancada/atualizar', {method: 'POST'}).then(function (r) { return r.json().then(function (j) { return [r.status, j]; }); })
      .then(function (x) { if (x[0] === 202 || x[0] === 409) acompanhar(); else bt.textContent = 'Não iniciou · tente de novo'; })
      .catch(function () { bt.textContent = 'Não iniciou · tente de novo'; });
  });
  // Se já houver coleta em andamento ao abrir a tela, mostra.
  fetch('/api/bancada/atualizar', {cache: 'no-store'}).then(function (r) { return r.json(); }).then(function (s) { if (s.rodando) acompanhar(); });
});
