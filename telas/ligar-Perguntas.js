/* Perguntas (Ctrl K): monta as perguntas e telas a partir do que se digita (nome do barbeiro e mês). ↑ ↓ escolhem, Enter abre. */
Bancada.pronto(function (d) {
  var B = Bancada, busca = B.$('#busca');
  var blocos = B.$$('[role="dialog"] > div').filter(function (x) { return x.querySelector('.rot'); });
  var perguntas = blocos[0], telas = blocos[1];
  var mesAnt = B.mesAnterior(d.hoje);
  var meses = Object.keys(d.casa).sort();
  function sem(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

  function itens(texto) {
    var t = sem(texto), palavras = t.split(/\s+/).filter(Boolean);
    var b = d.barbeiros.filter(function (x) { return palavras.indexOf(sem(x.barbeiro)) >= 0; })[0] || null;
    var mes = meses.filter(function (ym) { return palavras.indexOf(sem(B.mesNome(ym))) >= 0; }).pop() || mesAnt;
    var nm = B.mesNome(mes), P = [], T = [];
    var ym = mes, pm = '?periodo=' + ym;
    if (b) {
      var rel = 'Barbeiro.html?barbeiro=' + b.barber_id + '&periodo=' + ym;
      P.push(['Como foi o ' + b.barbeiro + ' em ' + nm + '?', rel, 'relatório']);
      P.push(['Quantos clientes do ' + b.barbeiro + ' voltaram em ' + nm + '?', rel, 'retenção']);
      P.push(['Quantos assinantes ativos o ' + b.barbeiro + ' tinha em ' + nm + '?', rel, 'assinaturas']);
      P.push(['Quanto produto o ' + b.barbeiro + ' vendeu em ' + nm + '?', rel, 'produto']);
      P.push(['Qual a meta proposta do ' + b.barbeiro + '?', 'Equipe-Metas.html', 'proposta']);
      T.push(['Relatório do ' + b.barbeiro + ' · ' + nm, rel, 'Dono']);
      T.push(['Carta do ' + b.barbeiro + ' no Placar da Casa', 'Equipe-Placar.html', 'Equipe']);
    } else {
      P.push(['Quanto a casa faturou em ' + nm + '?', 'Casa-Visao.html?mes=' + ym, 'certo']);
      P.push(['Quantos assinantes ativos a casa tinha em ' + nm + '?', 'Clientes-Clube.html' + pm, 'assinaturas']);
      P.push(['Quantos clientes voltaram em até 30 dias em ' + nm + '?', 'Clientes-Clube.html' + pm, 'retenção']);
      P.push(['Como os barbeiros se comparam em ' + nm + '?', 'Equipe-Barbeiros.html' + pm, 'equipe']);
      P.push(['Quem chamar para as vagas de amanhã?', 'Hoje-Recepcao.html', 'Recepção']);
      T.push(['Barbeiros lado a lado · ' + nm, 'Equipe-Barbeiros.html' + pm, 'Equipe']);
      T.push(['Placar da Casa', 'Equipe-Placar.html', 'Equipe']);
      T.push(['Clube de assinantes · ' + nm, 'Clientes-Clube.html' + pm, 'Clientes']);
      T.push(['Recepção: vagas e quem chamar', 'Hoje-Recepcao.html', 'Recepção']);
    }
    T.push(['A casa em ' + nm, 'Casa-Visao.html?mes=' + ym, 'Casa']);
    T.push(['Saúde dos dados', 'Casa-Fonte.html', 'Casa']);
    // Sem nome nem mês reconhecidos, filtra pelo texto; vazio mostra tudo.
    function filtro(lista) { return b || !t || palavras.some(function (p) { return /^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/.test(p); }) ? lista : lista.filter(function (x) { return sem(x[0]).indexOf(t) >= 0 || sem(x[2]).indexOf(t) >= 0; }); }
    return [filtro(P), filtro(T)];
  }

  var sel = 0;
  function desenhar() {
    var r = itens(busca.value);
    [[perguntas, r[0]], [telas, r[1]]].forEach(function (par) {
      par[0].querySelectorAll('a.res').forEach(function (a) { a.remove(); });
      par[0].style.display = par[1].length ? '' : 'none';
      par[1].forEach(function (x) {
        var a = document.createElement('a'), k = document.createElement('span');
        a.className = 'res'; a.href = x[1]; a.textContent = x[0] + ' ';
        k.className = 'k'; k.textContent = x[2]; a.appendChild(k);
        par[0].appendChild(a);
      });
    });
    var todos = B.$$('a.res');
    sel = Math.min(sel, Math.max(0, todos.length - 1));
    todos.forEach(function (a, i) { a.classList.toggle('on', i === sel); });
  }
  busca.value = '';
  busca.placeholder = 'Pergunte: nome do barbeiro, mês…';
  busca.addEventListener('input', function () { sel = 0; desenhar(); });
  busca.addEventListener('keydown', function (e) {
    var todos = B.$$('a.res');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + todos.length) % todos.length;
      todos.forEach(function (a, i) { a.classList.toggle('on', i === sel); });
    } else if (e.key === 'Enter' && todos[sel]) {
      location.href = todos[sel].getAttribute('href');
    }
  });
  desenhar();
  busca.focus();
});
