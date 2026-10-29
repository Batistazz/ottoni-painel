/* Equipe · Metas: metas propostas do dia (comanda e produto em reais) e a parte dos dias em que foram alcançadas. */
Bancada.pronto(function (d) {
  Bancada.PC.semPeriodo('As metas são do próximo dia de cada barbeiro.');
  var B = Bancada;
  var semanas = function (j) { return j ? Math.round((B.data(j[1]) - B.data(j[0])) / 864e5 / 7) : null; };
  B.$$('section.vidro.painel').forEach(function (sec) {
    var nomeEl = sec.querySelector('.nome'), b = d.barbeiros.filter(function (x) { return x.barbeiro === nomeEl.textContent.trim(); })[0];
    if (!b) return;
    var chip = sec.querySelector('.chip'), carta = B.carta(d, b.barber_id);
    if (b.barbeiro !== 'Igor') {
      chip.textContent = carta ? carta.overall : '—';
      chip.className = 'chip ' + (carta ? B.faixa(carta.overall) : 'preta');
    }
    // Selo e nome são botões: abrem a Hoje com o barbeiro escolhido.
    sec.querySelector('.cab').style.cursor = 'pointer';
    sec.querySelector('.cab').setAttribute('role', 'link');
    sec.querySelector('.cab').addEventListener('click', function () { location.href = 'Barbeiro.html?periodo=mes&barbeiro=' + b.barber_id; });
    var m = B.metaDoDia(b, d.hoje), sem = semanas(b.metas && b.metas.janela);
    sec.querySelector('.rot').textContent = m ? (m.hoje ? 'hoje' : m.dia) + ' · ' + sem + ' sem.' : 'sem meta proposta';
    // O sistema propõe métricas diferentes por barbeiro e dia; cada linha mostra uma métrica proposta.
    var ROT = {valor_comandas: ['COMANDA', true], produtos: ['PRODUTO', true], atendimentos: ['ATENDIMENTOS', false], servico_extra: ['SERVIÇO EXTRA', false]};
    var propostas = m ? Object.keys(ROT).filter(function (k) { return m[k]; }) : [];
    sec.querySelectorAll('.med').forEach(function (med, j) {
      var k = propostas[j], x = k && m[k];
      var bb = med.querySelector('b'), i = med.querySelector('.t i'), small = med.querySelector('small');
      if (!x) { med.style.display = j === 0 ? '' : 'none'; bb.textContent = '—'; i.style.width = '0%'; small.textContent = 'sem meta proposta'; return; }
      med.querySelector('.r').textContent = ROT[k][0];
      bb.textContent = ROT[k][1] ? B.reais(x.meta_proposta) : B.inteiro(x.meta_proposta);
      i.style.width = Math.round(x.bateu_pct) + '%';
      small.textContent = Math.round(x.bateu_pct) + '% dos dias (' + x.fracao_exata + ')';
    });
  });
  var nota = B.$('main.conteudo > p');
  if (nota) nota.textContent = 'Meta de produto em reais, nunca em unidades. A mesma janela vale para todas as metas do barbeiro. Metas propostas pelo sistema para o dia mostrado, ainda não aprovadas.';
});

/* Aprovar metas: grava as metas propostas de hoje (todas as métricas, por dia da escala) como aprovadas.
   Dois cliques (aprovar → confirmar); aprovadas, o botão mostra a data e desfaz. */
Bancada.pronto(function (d) {
  var B = Bancada, bt = B.$$('button').filter(function (x) { return /Aprovar metas/.test(x.textContent); })[0];
  if (!bt) return;
  bt.disabled = false;
  bt.style.cssText += ';cursor:pointer;border-style:solid';
  var aprovadas = [], confirmar = false;
  function propostas() {
    var rows = [];
    d.barbeiros.forEach(function (b) {
      var m = b.metas;
      if (!m || !m.dias_da_escala) return;
      m.dias_da_escala.forEach(function (k) {
        (m[k] || []).forEach(function (x) { rows.push({barber_id: b.barber_id, metrica: x.metrica, valor: x.meta_proposta, frequencia: 'diaria', dia_semana: k, inicio: d.hoje}); });
      });
    });
    return rows;
  }
  function rotulo(em) {
    confirmar = false;
    bt.textContent = aprovadas.length ? 'Metas aprovadas em ' + B.ddmm(em.slice(0, 10)) + ' · desfazer' : 'Aprovar metas propostas';
    bt.style.color = aprovadas.length ? '#63C08E' : '#E3A94B';
    bt.style.borderColor = aprovadas.length ? '#63C08E' : '#E3A94B';
  }
  function gravar(rows) {
    bt.textContent = 'Gravando…';
    fetch('/api/bancada/metas', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(rows)})
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { aprovadas = j.metas; rotulo(j.gravado_em); })
      .catch(function () { bt.textContent = 'Não gravou · tente de novo'; });
  }
  bt.addEventListener('click', function () {
    if (aprovadas.length) return gravar([]);
    var rows = propostas();
    if (!confirmar) { confirmar = true; bt.textContent = 'Confirmar: aprovar ' + rows.length + ' metas?'; return; }
    gravar(rows);
  });
  fetch('/api/bancada/metas', {cache: 'no-store'}).then(function (r) { return r.json(); })
    .then(function (j) { aprovadas = j.metas || []; rotulo(j.gravado_em || d.hoje); })
    .catch(function () { rotulo(d.hoje); });
});
