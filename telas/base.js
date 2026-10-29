/* Dados da Bancada: lê o resumo agregado uma vez e oferece formatação pt-BR.
   Número sem fonte vira "—"; nenhum valor de exemplo fica na tela. */
(function () {
  var promessa = null;
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  var CHAVE_DIA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

  function data(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +(p[2] || 1)); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  var B = window.Bancada = {
    MESES: MESES, DIAS: DIAS, CHAVE_DIA: CHAVE_DIA, data: data, iso: iso,
    dados: function () {
      return promessa || (promessa = fetch('painel.json', {cache: 'no-store'}).then(function (r) {
        if (!r.ok) throw new Error('painel ' + r.status);
        return r.json();
      }).then(function (d) {
        // `produto` virou bloco ({valor, itens, ...}); as telas leem R$ em `produto` e o resto em `produto_detalhe`.
        (function andar(o) {
          if (!o || typeof o !== 'object') return;
          if (o.produto && typeof o.produto === 'object' && !Array.isArray(o.produto) && 'valor' in o.produto) { o.produto_detalhe = o.produto; o.produto = o.produto.valor; }
          Object.keys(o).forEach(function (k) { if (k !== 'produto_detalhe') andar(o[k]); });
        })(d);
        // Meses do barbeiro ficam em barbeiro.por_mes; as telas procuram junto das janelas (estatisticas.por_mes).
        (d.barbeiros || []).forEach(function (b) { if (b.por_mes && b.estatisticas && !b.estatisticas.por_mes) b.estatisticas.por_mes = b.por_mes; });
        // Meses da casa trazem os clientes dentro de `clientes`; as janelas da casa, soltos. Uniformiza para o formato das janelas.
        var pm = d.clientes_casa && d.clientes_casa.por_mes;
        if (pm) Object.keys(pm).forEach(function (ym) {
          var m = pm[ym], c = m && m.clientes;
          if (c) Object.keys(c).forEach(function (k) { if (!(k in m) || k === 'periodo' && !m.periodo) m[k] = c[k]; });
        });
        return d;
      }));
    },
    inteiro: function (v) { return v == null ? '—' : Math.round(v).toLocaleString('pt-BR'); },
    reais: function (v) { return v == null ? '—' : 'R$ ' + Math.round(v).toLocaleString('pt-BR'); },
    mil: function (v) { return v == null ? '—' : (v / 1000).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1}); },
    pct: function (v, casas) { return v == null ? '—' : v.toLocaleString('pt-BR', {maximumFractionDigits: casas == null ? 0 : casas}) + '%'; },
    variacao: function (de, para) {
      if (!de || para == null) return null;
      var v = (para / de - 1) * 100;
      return (v >= 0 ? '+' : '−') + Math.abs(v).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1}) + '%';
    },
    ddmm: function (s) { var d = data(s); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); },
    hora: function (hhmm) { var p = hhmm.split(':'); return +p[0] + 'h' + (p[1] !== '00' ? p[1] : ''); },
    minutos: function (hhmm) { var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; },
    mesNome: function (ym) { return MESES[+ym.slice(5, 7) - 1]; },
    mesCurto: function (ym) { return MESES[+ym.slice(5, 7) - 1].slice(0, 3); },
    // Mês anterior ao mês de "hoje", em AAAA-MM.
    mesAnterior: function (hoje) { var d = data(hoje.slice(0, 7) + '-01'); d.setMonth(d.getMonth() - 1); return iso(d).slice(0, 7); },
    param: function (k) { return new URLSearchParams(location.search).get(k); },
    barbeiro: function (d, id) { return d.barbeiros.filter(function (b) { return b.barber_id === id; })[0] || null; },
    // Celular: o barbeiro vem do endereço (?barbeiro=); sem ele, o primeiro barbeiro da equipe que não é o Igor.
    eu: function (d) {
      return B.barbeiro(d, B.param('barbeiro')) || d.barbeiros.filter(function (b) { return b.barbeiro !== 'Igor'; })[0] || null;
    },
    // Leva o barbeiro escolhido em todos os links entre telas de celular.
    levarBarbeiro: function (id, raiz) {
      B.$$('a[href^="Celular-"]', raiz).forEach(function (a) { a.setAttribute('href', a.getAttribute('href').split('?')[0] + '?barbeiro=' + id); });
    },
    // Carta de celular: faixa, nota e nome; o Igor é fundador e fica fora do placar.
    pintarCarta: function (d, b, el) {
      var c = B.carta(d, b.barber_id), igor = b.barbeiro === 'Igor';
      el.className = 'fut ' + (igor || !c ? 'preta' : B.faixa(c.overall));
      el.querySelector('.ovr').textContent = igor ? 'FUN' : c ? c.overall : '—';
      el.querySelector('.pos').textContent = igor ? '' : 'BAR';
      el.querySelector('.nome').textContent = b.barbeiro.toUpperCase();
      return c;
    },
    // Meta de comanda proposta do dia no bloco dourado (valor, barra = parte dos dias em que foi alcançada).
    pintarMeta: function (b, hoje, rotEl, valorEl, barraEl, textoEl) {
      var m = B.metaDoDia(b, hoje), x = m && m.valor_comandas;
      rotEl.textContent = 'Minha meta · comanda' + (m && !m.hoje ? ' · ' + m.dia : '');
      valorEl.textContent = x ? B.reais(x.meta_proposta) : '—';
      barraEl.style.width = x ? Math.round(x.bateu_pct) + '%' : '0%';
      textoEl.lastChild.nodeValue = x ? Math.round(x.bateu_pct) + '% dos dias · proposta' : 'sem meta proposta';
    },
    carta: function (d, id) { return d.placar ? d.placar.cartas.filter(function (c) { return c.barber_id === id; })[0] || null : null; },
    // Faixas propostas (pendente do João): ouro ≥ 85, prata 75–84, bronze < 75.
    // Régua de produção: atendimentos por dia contra a capacidade da cadeira dele (horas abertas ÷ ritmo dele),
    // com as faixas de mínimo e bônus da proposta (config/regua.json). Cinza: faixas; dourado: ele.
    regua: function (alvo, e, r, dele) {
      alvo.innerHTML = '';
      var t = e && e.tempo_parado;
      if (!r || !t || !t.dias || !e.atendimentos || !t.atendendo_min) { alvo.textContent = 'Sem dia trabalhado no período.'; return; }
      var ritmo = t.atendendo_min / e.atendimentos, cap = t.aberto_min / ritmo / t.dias, eu = e.atendimentos / t.dias;
      var pm = r.minimo_pct, pb = r.bonus_pct, pos = Math.min(100, eu / cap * 100);
      function um(v) { return v.toLocaleString('pt-BR', {maximumFractionDigits: 1}); }
      function el(tag, css, txt) { var n = document.createElement(tag); n.style.cssText = css; if (txt != null) n.textContent = txt; return n; }
      var faixa = pos < pm ? 'abaixo do mínimo' : pos < pb ? 'entre o mínimo e o bônus' : 'na faixa de bônus';
      var topo = el('div', 'display:flex;justify-content:space-between;align-items:baseline;gap:8px');
      topo.appendChild(el('span', 'font-size:13px', 'Atendimentos por dia'));
      var v = el('b', "font-family:'Bebas Neue',sans-serif;font-weight:400;font-size:28px;line-height:1;color:#E9CE7A", um(eu)); topo.appendChild(v);
      alvo.appendChild(topo);
      alvo.appendChild(el('small', 'display:block;font-size:12px;color:rgba(235,235,245,.7);margin:2px 0 8px', Math.round(eu / cap * 100) + '% da capacidade da ' + (dele ? 'cadeira dele' : 'sua cadeira') + ' · ' + faixa));
      var trilho = el('div', 'position:relative;height:12px;border-radius:6px;background:rgba(235,235,245,.08)');
      [[0, pm, '.08'], [pm, pb, '.18'], [pb, 100, '.32']].forEach(function (s) { trilho.appendChild(el('i', 'position:absolute;top:0;bottom:0;left:' + s[0] + '%;width:' + (s[1] - s[0]) + '%;background:rgba(235,235,245,' + s[2] + ');border-radius:' + (s[0] ? '0' : '6px 0 0 6px') + (s[1] === 100 ? ';border-radius:0 6px 6px 0' : ''))); });
      trilho.appendChild(el('i', 'position:absolute;top:-5px;height:22px;width:4px;border-radius:2px;background:#E9CE7A;box-shadow:0 0 10px rgba(233,206,122,.7);left:calc(' + pos + '% - 2px)'));
      trilho.setAttribute('role', 'img');
      trilho.setAttribute('aria-label', 'Você: ' + um(eu) + ' por dia. Mínimo ' + um(cap * pm / 100) + ', bônus ' + um(cap * pb / 100) + ', capacidade ' + um(cap) + '.');
      alvo.appendChild(trilho);
      // Números em cima de cada divisa; os nomes ficam na legenda, para não encavalar no celular.
      var marcas = el('div', 'position:relative;height:16px;margin-top:5px;font-size:11px;font-weight:600;color:#F2EFE9');
      [[pm, cap * pm / 100, 'translateX(-50%)'], [pb, cap * pb / 100, 'translateX(-50%)'], [100, cap, 'translateX(-100%)']].forEach(function (m) { marcas.appendChild(el('span', 'position:absolute;top:0;white-space:nowrap;left:' + m[0] + '%;transform:' + m[2], um(m[1]))); });
      alvo.appendChild(marcas);
      alvo.appendChild(el('small', 'display:block;font-size:11px;color:rgba(235,235,245,.7);margin-top:2px', 'mínimo ' + um(cap * pm / 100) + ' · bônus ' + um(cap * pb / 100) + ' · capacidade ' + um(cap) + ' por dia'));
    },
    // Régua de produto: R$ de produto por dia trabalhado contra a parte dele na meta geral da casa (config/regua.json).
    reguaProduto: function (alvo, e, r, dele) {
      alvo.innerHTML = '';
      // No painel, produto já chega como número (o detalhe fica em produto_detalhe).
      var pr = e ? (typeof e.produto === 'number' ? e.produto : e.produto && e.produto.valor) : null;
      if (!r || !e || !e.dias_trabalhados || pr == null || !r.produto_dia_bonus) { alvo.textContent = 'Sem dia trabalhado no período.'; return; }
      var eu = pr / e.dias_trabalhados, min = r.produto_dia_minimo, bon = r.produto_dia_bonus, topo = Math.max(bon * 1.5, eu * 1.1), pos = eu / topo * 100;
      function rs(v) { return 'R$ ' + Math.round(v).toLocaleString('pt-BR'); }
      function el(tag, css, txt) { var n = document.createElement(tag); n.style.cssText = css; if (txt != null) n.textContent = txt; return n; }
      var faixa = eu < min ? 'abaixo do mínimo' : eu < bon ? 'entre o mínimo e o bônus' : 'na faixa de bônus';
      var cab = el('div', 'display:flex;justify-content:space-between;align-items:baseline;gap:8px');
      cab.appendChild(el('span', 'font-size:13px', 'Produto por dia trabalhado'));
      cab.appendChild(el('b', "font-family:'Bebas Neue',sans-serif;font-weight:400;font-size:28px;line-height:1;color:#E9CE7A", rs(eu)));
      alvo.appendChild(cab);
      alvo.appendChild(el('small', 'display:block;font-size:12px;color:rgba(235,235,245,.7);margin:2px 0 8px', B.reais(pr) + ' em ' + B.inteiro(e.dias_trabalhados) + (e.dias_trabalhados === 1 ? ' dia · ' : ' dias · ') + faixa));
      var pm = min / topo * 100, pb = bon / topo * 100;
      var trilho = el('div', 'position:relative;height:12px;border-radius:6px;background:rgba(235,235,245,.08)');
      [[0, pm, '.08'], [pm, pb, '.18'], [pb, 100, '.32']].forEach(function (s) { trilho.appendChild(el('i', 'position:absolute;top:0;bottom:0;left:' + s[0] + '%;width:' + (s[1] - s[0]) + '%;background:rgba(235,235,245,' + s[2] + ')' + (s[0] ? '' : ';border-radius:6px 0 0 6px') + (s[1] === 100 ? ';border-radius:0 6px 6px 0' : ''))); });
      trilho.appendChild(el('i', 'position:absolute;top:-5px;height:22px;width:4px;border-radius:2px;background:#E9CE7A;box-shadow:0 0 10px rgba(233,206,122,.7);left:calc(' + pos + '% - 2px)'));
      trilho.setAttribute('role', 'img');
      trilho.setAttribute('aria-label', (dele ? 'Ele: ' : 'Você: ') + rs(eu) + ' por dia. Mínimo ' + rs(min) + ', bônus ' + rs(bon) + '.');
      alvo.appendChild(trilho);
      var marcas = el('div', 'position:relative;height:16px;margin-top:5px;font-size:11px;font-weight:600;color:#F2EFE9');
      [[pm, min], [pb, bon]].forEach(function (m) { marcas.appendChild(el('span', 'position:absolute;top:0;white-space:nowrap;transform:translateX(-50%);left:' + m[0] + '%', rs(m[1]))); });
      alvo.appendChild(marcas);
      alvo.appendChild(el('small', 'display:block;font-size:11px;color:rgba(235,235,245,.7);margin-top:2px', 'mínimo ' + rs(min) + ' · bônus a partir de ' + rs(bon) + ' por dia trabalhado'));
    },
    faixa: function (nota) { return nota == null ? '' : nota >= 85 ? 'ouro' : nota >= 75 ? 'prata' : 'bronze'; },
    // Atributos do placar atual nos rótulos da carta; PRE fica "—" até haver escala confirmada.
    atributos: function (carta) {
      var por = {};
      if (carta) carta.atributos.forEach(function (a) { por[a.code] = a.rating; });
      return {ATD: por.ATE, RET: por.RET, NOV: por.NOV, PRO: por.PRO, EXT: por.SER, PRE: por.PRE};
    },
    // Meta proposta do dia: hoje, se o barbeiro atende hoje; senão o próximo dia da escala.
    metaDoDia: function (b, hoje) {
      if (!b || !b.metas || !b.metas.dias_da_escala) return null;
      var escala = b.metas.dias_da_escala, d = data(hoje);
      for (var i = 0; i < 7; i++) {
        var k = CHAVE_DIA[(d.getDay() + i) % 7];
        if (escala.indexOf(k) >= 0 && b.metas[k] && b.metas[k].length) {
          var m = {dia: k, hoje: i === 0};
          b.metas[k].forEach(function (x) { m[x.metrica] = x; });
          return m;
        }
      }
      return null;
    },
    // Troca um texto exato da tela (primeira ocorrência ainda não trocada).
    trocar: function (antigo, novo, raiz) {
      var w = document.createTreeWalker(raiz || document.body, NodeFilter.SHOW_TEXT), n;
      while ((n = w.nextNode())) {
        if (n.nodeValue.trim() === antigo) { n.nodeValue = n.nodeValue.replace(antigo, novo); return n.parentNode; }
      }
      return null;
    },
    $: function (s, r) { return (r || document).querySelector(s); },
    $$: function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  };

  // Selo de saúde (topo de toda tela): data real dos dados e estado da coleta.
  function selo(d) {
    var s = d.saude, ate = s && s.dados_ate ? B.ddmm(s.dados_ate) : null;
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n, achou = [];
    while ((n = w.nextNode())) if (/^(dados )?até (\d{2}\/\d{2}|—)$/.test(n.nodeValue.trim())) achou.push(n);
    achou.forEach(function (n) {
      var curto = n.nodeValue.trim().indexOf('dados') !== 0;
      n.nodeValue = ate ? (curto ? 'até ' : 'dados até ') + ate + (s.coleta === 'ok' ? '' : ' · coleta ' + s.coleta) : 'dados indisponíveis';
      if (!ate || s.coleta !== 'ok') {
        var bola = n.parentNode.querySelector('span');
        if (bola) { bola.style.background = '#E3A94B'; bola.style.boxShadow = '0 0 10px #E3A94B'; }
      }
    });
  }
  // Celular: seletor Dia/Semana/Mês comum. "Dia" é o último dia trabalhado; hoje só entra na coleta de amanhã.
  B.Celular = {
    CHAVE: {Dia: 'ultimo_dia', Semana: 'semana', 'Mês': 'mes'},
    periodos: function (mostrar, inicial) {
      var bts = B.$$('.seg button');
      function escolher(bt) {
        bts.forEach(function (x) { x.className = x === bt ? 'on' : ''; x.setAttribute('aria-checked', x === bt ? 'true' : 'false'); });
        mostrar(B.Celular.CHAVE[bt.textContent.trim()]);
      }
      bts.forEach(function (bt) { bt.addEventListener('click', function () { escolher(bt); }); });
      escolher(bts.filter(function (x) { return x.textContent.trim() === (inicial || 'Semana'); })[0] || bts[0]);
    },
    janela: function (per, w) {
      if (!per || !per.inicio) return 'sem dados no período';
      var rot = {ultimo_dia: 'último dia trabalhado', semana: 'semana', mes: B.mesNome(per.inicio.slice(0, 7)), mes_anterior: B.mesNome(per.inicio.slice(0, 7))}[w] || B.mesNome(per.inicio.slice(0, 7));
      var datas = per.inicio === per.fim ? B.ddmm(per.inicio) : B.ddmm(per.inicio) + '–' + B.ddmm(per.fim);
      return rot + ' · ' + datas + (per.parcial ? ' · parcial' : '');
    },
    // Retorno do mês anterior para o mês atual: à casa e, se houver rótulo, com o próprio barbeiro.
    retorno: function (r, rotEle) {
      var ok = r && r.base;
      B.$('#v-casa').textContent = ok ? B.pct(r.percentual_casa) : '—';
      B.$('#v-casa-barra').style.width = ok ? r.percentual_casa + '%' : '0%';
      var linhaEle = B.$('#v-ele').parentNode, barraEle = B.$('#v-ele-barra').parentNode;
      linhaEle.style.display = barraEle.style.display = rotEle ? '' : 'none';
      if (rotEle) {
        B.$('#v-ele-rot').textContent = rotEle;
        B.$('#v-ele').textContent = ok ? B.pct(r.percentual_com_ele) : '—';
        B.$('#v-ele-barra').style.width = ok ? r.percentual_com_ele + '%' : '0%';
      }
      if (!ok) { B.$('#v-nota').textContent = 'sem base no mês anterior'; return; }
      var pb = r.periodo_base, mesBase = B.mesNome(pb.inicio.slice(0, 7));
      B.$('#v-nota').textContent = 'De ' + B.inteiro(r.base) + ' pessoas atendidas em ' + mesBase + ', ' + B.inteiro(r.voltaram_casa) + ' voltaram à casa' +
        (rotEle ? ' (' + B.inteiro(r.voltaram_com_ele) + ' com você)' : '') + ' no mês seguinte' + (r.parcial ? ', até agora' : '') + '.';
    }
  };

  // PC: o seletor do topo vale em todas as telas e fica no endereço (?periodo=hoje|semana|mes|mes_anterior),
  // inclusive nos links entre telas. "Hoje" nos números = último dia trabalhado (o dia corrente entra na coleta de amanhã).
  B.PC = {
    PARAM: ['hoje', 'semana', 'mes', 'mes_anterior'],
    DADO: {hoje: 'ultimo_dia', semana: 'semana', mes: 'mes', mes_anterior: 'mes_anterior'},
    // Período inicial: no começo do mês, enquanto o mês corrente não tem dia coletado, abre no mês anterior.
    padrao: function (d, quero) {
      var m = d.clientes_casa && d.clientes_casa.mes;
      return (quero || 'mes') === 'mes' && (!m || !m.periodo || !m.periodo.fim) ? 'mes_anterior' : (quero || 'mes');
    },
    // Dado de uma janela: 'mes:AAAA-MM' vem de por_mes (qualquer mês); o resto, da janela com esse nome.
    bloco: function (obj, w) {
      if (!obj) return null;
      if (w.indexOf('mes:') === 0) return obj.por_mes ? obj.por_mes[w.slice(4)] || null : null;
      return obj[w] || null;
    },
    // meses: lista AAAA-MM para a faixa ‹ jul ago set out › abaixo do topo (opcional).
    periodos: function (mostrar, padrao, meses) {
      var bts = B.$$('.seg[aria-label="Período"] button'), hoje = null, faixa = null, chips = [], setas = [];
      var atual = function () { return (hoje || new Date().toISOString()).slice(0, 7); };
      B.dados().then(function (d) { hoje = d.hoje; });
      function levar(p) {
        B.$$('a[href$=".html"], a[href*=".html?"]').forEach(function (a) {
          var h = a.getAttribute('href');
          if (h.indexOf('Celular-') === 0 || /^https?:/.test(h)) return;
          var u = new URL(h, location.href); u.searchParams.set('periodo', p);
          a.setAttribute('href', u.pathname.split('/').pop() + u.search);
        });
      }
      // p = hoje|semana|mes|mes_anterior ou AAAA-MM. O mês corrente e o anterior usam as janelas existentes.
      function escolher(p) {
        var w, ym = /^\d{4}-\d{2}$/.test(p) ? p : null, cur = atual(), ant = B.mesAnterior(cur + '-01');
        if (ym === cur) p = 'mes', ym = null; else if (ym === ant) p = 'mes_anterior', ym = null;
        w = ym ? 'mes:' + ym : B.PC.DADO[p];
        var mesVisto = ym || (p === 'mes' ? cur : p === 'mes_anterior' ? ant : null);
        bts.forEach(function (x, j) { var on = B.PC.PARAM[j] === p; x.className = on ? 'on' : ''; x.setAttribute('aria-checked', on ? 'true' : 'false'); });
        chips.forEach(function (c) { var on = c.getAttribute('data-mes') === mesVisto; c.classList.toggle('on', on); c.setAttribute('aria-selected', on ? 'true' : 'false'); });
        // Setas nas pontas da faixa ficam apagadas.
        var idx = chips.map(function (c) { return c.getAttribute('data-mes'); }).indexOf(mesVisto);
        if (setas.length) { setas[0].disabled = idx === 0; setas[1].disabled = idx === chips.length - 1; setas.forEach(function (x) { x.style.opacity = x.disabled ? '.3' : '1'; x.style.cursor = x.disabled ? 'default' : 'pointer'; }); }
        var q = new URLSearchParams(location.search);
        q.set('periodo', ym || p); history.replaceState(null, '', '?' + q.toString());
        levar(ym || p);
        mostrar(w, ym || p);
        return mesVisto;
      }
      bts.forEach(function (bt, i) {
        if (bt.getAttribute('aria-disabled') === 'true') return;
        bt.addEventListener('click', function () { escolher(B.PC.PARAM[i]); });
      });
      if (meses && meses.length) {
        faixa = document.createElement('div');
        faixa.className = 'vidro'; faixa.setAttribute('role', 'listbox'); faixa.setAttribute('aria-label', 'Meses');
        faixa.style.cssText = 'align-self:flex-start;display:inline-flex;align-items:center;gap:4px;padding:5px;border-radius:999px';
        var seta = function (txt, rot, passo) {
          var b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', rot);
          b.style.cssText = 'width:34px;height:34px;border-radius:50%;border:0;background:none;color:#F2EFE9;font-size:18px;cursor:pointer';
          b.addEventListener('click', function () {
            var on = chips.map(function (c) { return c.classList.contains('on'); }).indexOf(true);
            var i = on < 0 ? chips.length - 1 : Math.max(0, Math.min(chips.length - 1, on + passo));
            escolher(chips[i].getAttribute('data-mes'));
          });
          setas.push(b);
          return b;
        };
        faixa.appendChild(seta('‹', 'Mês anterior a este', -1));
        meses.forEach(function (ym) {
          var c = document.createElement('button'); c.type = 'button'; c.setAttribute('role', 'option'); c.setAttribute('data-mes', ym);
          c.textContent = B.mesCurto(ym);
          c.style.cssText = 'min-height:34px;padding:0 14px;border-radius:999px;border:0;background:none;color:rgba(235,235,245,.7);font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer';
          c.addEventListener('click', function () { escolher(ym); });
          chips.push(c); faixa.appendChild(c);
        });
        faixa.appendChild(seta('›', 'Mês seguinte', 1));
        var estilo = document.createElement('style');
        estilo.textContent = '[data-mes].on{background:rgba(255,255,255,.92)!important;color:#0B0B0C!important}';
        document.head.appendChild(estilo);
        var main = B.$('main.conteudo'), alvo = B.$('#faixa-meses');
        if (alvo) alvo.appendChild(faixa); else if (main) main.insertBefore(faixa, main.firstChild);
      }
      var pedido = B.param('periodo');
      escolher(pedido && (B.PC.PARAM.indexOf(pedido) >= 0 || /^\d{4}-\d{2}$/.test(pedido)) ? pedido : (padrao || 'mes'));
    },
    // Telas de um dia ou de um mês fixo: o seletor fica apagado e diz por quê, em vez de parecer quebrado.
    semPeriodo: function (motivo) {
      var grupo = B.$('.seg[aria-label="Período"]');
      if (!grupo) return;
      grupo.style.opacity = '.35';
      grupo.title = motivo;
      B.$$('button', grupo).forEach(function (bt) { bt.setAttribute('aria-disabled', 'true'); bt.classList.remove('on'); bt.setAttribute('aria-checked', 'false'); bt.style.cursor = 'not-allowed'; bt.title = motivo; });
      // Mantém o período escolhido nos links para as outras telas.
      var p = B.param('periodo');
      if (p) B.$$('a[href$=".html"]').forEach(function (a) { if (a.getAttribute('href').indexOf('Celular-') !== 0) a.setAttribute('href', a.getAttribute('href') + '?periodo=' + p); });
    },
    // Só alguns períodos valem (ex.: Casa só tem mês e mês anterior): os outros ficam apagados.
    apagar: function (rotulos, motivo) {
      B.$$('.seg[aria-label="Período"] button').forEach(function (bt) {
        if (rotulos.indexOf(bt.textContent.trim()) < 0) return;
        bt.setAttribute('aria-disabled', 'true'); bt.style.opacity = '.35'; bt.style.cursor = 'not-allowed'; bt.title = motivo;
      });
    }
  };

  // Fotos dos barbeiros (copiadas do BestBarbers, servidas pelo painel) no lugar da silhueta das cartas.
  // Observa a tela porque a Hoje redesenha as cartas a cada troca de período ou barbeiro.
  function fotos(d) {
    var porNome = {};
    d.barbeiros.forEach(function (b) { porNome[b.barbeiro.toUpperCase()] = b.barber_id; });
    function aplicar() {
      B.$$('.fut').forEach(function (c) {
        var nome = c.querySelector('.nome'), id = nome && porNome[nome.textContent.trim().toUpperCase()];
        if (!id) return;
        var atual = c.querySelector('.busto'), src = 'fotos/' + id + '.jpg';
        if (atual && atual.tagName === 'IMG' && atual.getAttribute('src') === src) return;
        var img = document.createElement('img');
        img.className = 'busto foto'; img.alt = ''; img.src = src;
        img.onerror = function () { img.remove(); };
        if (atual) atual.replaceWith(img); else nome.parentNode.insertBefore(img, nome);
      });
    }
    aplicar();
    new MutationObserver(aplicar).observe(document.body, {childList: true, subtree: true, characterData: true});
  }
  B.pronto = function (fn) {
    function rodar() {
      B.dados().then(function (d) { selo(d); if (fn) fn(d); fotos(d); }).catch(function () {
        // Sem dados, os números de exemplo do desenho não podem ficar à vista: a tela apaga e tenta de novo.
        if (document.body.classList.contains('sem-dados')) return;
        document.body.classList.add('sem-dados');
        var aviso = document.createElement('div');
        aviso.className = 'aviso-sem-dados';
        aviso.textContent = 'Dados indisponíveis agora. Tentando de novo a cada 10 segundos…';
        document.body.appendChild(aviso);
        setInterval(function () {
          fetch('painel.json', {cache: 'no-store'}).then(function (r) { if (r.ok) location.reload(); }).catch(function () {});
        }, 10000);
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', rodar); else rodar();
  };
})();
