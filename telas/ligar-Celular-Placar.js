/* Celular · Placar (lente Barbeiro): a própria carta do último mês fechado. Sem meta coletiva definida ainda. */
Bancada.pronto(function (d) {
  var B = Bancada, b = B.eu(d);
  if (!b) return;
  B.levarBarbeiro(b.barber_id);
  var mes = d.placar && d.placar.mes, igor = b.barbeiro === 'Igor';
  B.$('.rot').textContent = 'Placar da Casa · ' + (mes ? B.mesNome(mes) : 'sem placar');
  var c = B.pintarCarta(d, b, B.$('.fut'));
  var NOME = {ouro: 'é ouro', prata: 'é prata', bronze: 'é bronze'};
  B.$('h1 span').textContent = igor ? 'fundador, fora do placar' : c ? NOME[B.faixa(c.overall)] : 'ainda sem nota';
  var at = B.atributos(c);
  B.$$('.stats span').forEach(function (s) {
    var k = s.lastChild.nodeValue.trim();
    s.querySelector('b').textContent = at[k] == null ? '—' : at[k];
  });

  // Selos: melhor atributo e dias trabalhados no mês da nota.
  var selos = B.$$('.fut').length && B.$('.fut').parentNode.nextElementSibling.querySelectorAll('span');
  var melhor = c ? c.atributos.slice().sort(function (x, y) { return y.rating - x.rating; })[0] : null;
  var e = b.estatisticas && b.estatisticas.mes_anterior;
  selos[0].textContent = melhor ? 'melhor: ' + melhor.label.toLowerCase() + ' ' + melhor.rating : 'sem atributos';
  if (e && mes && e.periodo.inicio.slice(0, 7) === mes) selos[1].textContent = e.dias_trabalhados + ' dias trabalhados em ' + B.mesNome(mes);
  else selos[1].style.display = 'none';

  var meta = B.$$('.vidro').filter(function (x) { return /Meta coletiva/.test(x.textContent); })[0];
  if (meta) {
    meta.querySelectorAll('span')[1].textContent = '—';
    meta.querySelector('i').style.width = '0%';
    meta.querySelectorAll('span')[0].textContent = 'Meta coletiva · ainda não definida';
  }
  var nota = B.$$('p').pop();
  nota.textContent = (mes ? 'Nota de ' + B.mesNome(mes) + ', ' : '') + 'notas de 50 a 99, relativas à equipe; proposta ainda não aprovada. EXT conta serviços por atendimento, inclusive itens do plano sem cobrança. A nota geral inclui ticket avulso e evolução.';
});
