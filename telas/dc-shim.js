/* Mini-runtime só para os protótipos (não usar no painel real).
   Lê o modelo da tela (window.DC_TPL), roda a classe Component e redesenha a cada setState. */
(function () {
  var handlers = [];
  var comp = null;
  var raiz = null;

  function pegar(obj, caminho) {
    return caminho.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function preencher(tpl, ctx) {
    tpl = tpl.replace(/\son([A-Za-z]+)="\{\{\s*([\w.$]+)\s*\}\}"/g, function (_, ev, cam) {
      var fn = pegar(ctx, cam);
      if (typeof fn !== 'function') return '';
      handlers.push(fn);
      return ' data-dc-on="' + ev.toLowerCase() + ':' + (handlers.length - 1) + '"';
    });
    return tpl.replace(/\{\{\s*([\w.$]+)\s*\}\}/g, function (_, cam) { return esc(pegar(ctx, cam)); });
  }
  function expandirFor(tpl, vals) {
    return tpl.replace(/<sc-for\s+list="\{\{\s*([\w.$]+)\s*\}\}"\s+as="(\w+)"[^>]*>([\s\S]*?)<\/sc-for>/g, function (_, lista, nome, corpo) {
      var itens = pegar(vals, lista) || [];
      return itens.map(function (it) {
        var ctx = Object.assign({}, vals); ctx[nome] = it;
        return preencher(corpo, ctx);
      }).join('');
    });
  }
  function caminhoDoFoco() {
    var a = document.activeElement;
    if (!a || !raiz.contains(a)) return null;
    var focaveis = Array.prototype.slice.call(raiz.querySelectorAll('button,a,input,[tabindex]'));
    return focaveis.indexOf(a);
  }
  function desenhar() {
    var i = caminhoDoFoco();
    handlers = [];
    var vals = comp.renderVals ? comp.renderVals() : {};
    raiz.innerHTML = preencher(expandirFor(window.DC_TPL, vals), vals);
    raiz.querySelectorAll('[data-dc-on]').forEach(function (el) {
      var p = el.getAttribute('data-dc-on').split(':');
      el.addEventListener(p[0], handlers[+p[1]]);
    });
    if (i != null && i >= 0) {
      var f = raiz.querySelectorAll('button,a,input,[tabindex]')[i];
      if (f) f.focus();
    }
  }
  window.DCLogic = function DCLogic(props) { this.props = props || {}; this.state = {}; };
  window.DCLogic.prototype.setState = function (p) { Object.assign(this.state, p); desenhar(); };
  window.dcMontar = function (Classe) {
    raiz = document.getElementById('dc-raiz');
    comp = new Classe({});
    desenhar();
  };
})();
