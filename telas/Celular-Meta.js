/* Celular · Roda da meta com dados reais: níveis tirados da distribuição dos dias trabalhados do barbeiro
   naquele dia da semana. A proposta tem a fração exata; os quartis dão a parte aproximada (≈). Salvar ainda não grava. */
Bancada.pronto(function (d) {
  var B = Bancada, b = B.eu(d);
  var PLURAL = {seg: 'segundas', ter: 'terças', qua: 'quartas', qui: 'quintas', sex: 'sextas', 'sáb': 'sábados', dom: 'domingos'};
  var m = b && B.metaDoDia(b, d.hoje), x = m && m.valor_comandas;
  var dez = function (v) { return Math.round(v / 10) * 10; };
  var N = [];
  if (x) {
    var q = x.distribuicao;
    N = [[dez(q.p25), '≈75%'], [dez(q.mediana), '≈50%'], [x.meta_proposta, Math.round(x.bateu_pct) + '%', true], [dez(q.p75), '≈25%'], [q.max, '1/' + x.n]];
    N.sort(function (a, b2) { return a[0] - b2[0]; });
  }
  var inicio = Math.max(0, N.findIndex(function (n) { return n[2]; }));
  var id = b ? b.barber_id : '';

  window.DC_TPL = window.DC_TPL.split('Celular-Hoje.html').join('Celular-Hoje.html?barbeiro=' + id)
    .replace('<span class="rot">Kevim</span>', '<span class="rot">' + (b ? b.barbeiro : '—') + '</span>')
    .replace('Ao lado, a parte dos seus dias trabalhados (8 semanas)', x
      ? 'Ao lado, a parte das suas ' + PLURAL[m.dia] + ' trabalhadas (' + x.n + ' dias)'
      : 'Sem meta proposta para você ainda. Ao lado, a parte dos dias')
    .replace('o nível do meio é a proposta do sistema · valores de exemplo', 'o nível com a fração exata é a proposta do sistema · a meta que vale é a que o Igor passar')
    // D21: a meta é combinada pelo Igor; a roda serve para consultar, não para gravar.
    .replace('Gire para escolher.', 'Gire para ver.')
    .replace('>Salvar minha meta<', '>Voltar<');

  class Component extends DCLogic {
    constructor(props) {
      super(props);
      this.state = { i: inicio };
    }
    renderVals() {
      var self = this, i = this.state.i;
      function set(k) { self.setState({ i: Math.max(0, Math.min(N.length - 1, k)) }); }
      var atual = N[i];
      return {
        idx: i,
        valuetext: atual ? 'R$ ' + atual[0] + ', alcançada em ' + atual[1] + ' dos dias' : 'sem meta proposta',
        valorAtual: atual ? atual[0] : '',
        offset: 120 - i * 60,
        niveis: N.map(function (n, j) { return { valor: n[0], pct: n[1], cls: j === i ? 'nivel sel' : 'nivel' }; }),
        menos: function () { set(i - 1); },
        mais: function () { set(i + 1); },
        tecla: function (e) {
          if (e.key === 'ArrowUp') { set(i - 1); e.preventDefault(); }
          if (e.key === 'ArrowDown') { set(i + 1); e.preventDefault(); }
          if (e.key === 'Home') { set(0); e.preventDefault(); }
          if (e.key === 'End') { set(N.length - 1); e.preventDefault(); }
        }
      };
    }
  }

  window.dcMontar(Component);
});
