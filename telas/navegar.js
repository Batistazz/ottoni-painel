/* Navegação entre as telas do visual (sem dados). Liga o que os protótipos deixaram só no estado:
   lente Recepção/Barbeiro/Dono, Ctrl K para Perguntas e Esc para voltar. Não altera o desenho. */
(function () {
  var pagina = location.pathname.split('/').pop() || 'Main.html';
  var celular = pagina.indexOf('Celular-') === 0;
  var destinoLente = {
    'Recepção': 'Hoje-Recepcao.html',
    'Barbeiro': 'Celular-Hoje.html',
    'Dono': 'Main.html'
  };

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button[role="radio"]');
    if (!b) return;
    var rotulo = b.textContent.trim();
    var destino = destinoLente[rotulo];
    if (!destino || destino === pagina) return;
    // No Início, Dono é a própria tela; Barbeiro abre o celular do barbeiro escolhido nas cartas.
    if (pagina === 'Main.html' && rotulo === 'Dono') return;
    if (rotulo === 'Barbeiro') { var eu = new URLSearchParams(location.search).get('barbeiro'); if (eu && eu !== 'equipe') destino += '?barbeiro=' + encodeURIComponent(eu); }
    // Na Recepção, Dono volta para Hoje; nas outras telas do Dono, Dono já é a lente atual.
    if (rotulo === 'Dono' && pagina !== 'Hoje-Recepcao.html') return;
    e.preventDefault();
    e.stopPropagation();
    location.href = destino;
  }, true);

  document.addEventListener('keydown', function (e) {
    if (!celular && pagina !== 'Perguntas.html' && (e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      location.href = 'Perguntas.html';
    } else if (pagina === 'Perguntas.html' && e.key === 'Escape') {
      e.preventDefault();
      if (history.length > 1) history.back(); else location.href = 'Main.html';
    }
  });
})();
