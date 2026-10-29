/* Celular · Campanha: prévia desligada (sem link nas outras telas). A meta é a real; o palpite fica travado até haver decisão. */
Bancada.pronto(function (d) {
  var B = Bancada, b = B.eu(d);
  if (!b) return;
  B.levarBarbeiro(b.barber_id);
  var bloco = B.$$('section')[1], esq = bloco.children[0], dir = bloco.children[1];
  B.pintarMeta(b, d.hoje, esq.querySelector('.rot'), esq.children[1], dir.querySelector('i'), dir.children[1]);
  B.$$('.seg button').forEach(function (bt) { bt.disabled = true; });
  B.$('.palco > div > p').textContent = 'Prévia de um modo de campanha, ainda não ligado. Sem escudos de clube e sem marcas da FIFA ou da CBF.';
});
