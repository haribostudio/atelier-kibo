/* KIBO Paris — panier (localStorage + permalink checkout Shopify) */
(function () {
  var SHOP = 'https://djcwtp-ui.myshopify.com';
  var CLE = 'kibo_panier';

  function lire() { try { return JSON.parse(localStorage.getItem(CLE)) || []; } catch (e) { return []; } }
  function ecrire(p) { localStorage.setItem(CLE, JSON.stringify(p)); majBadge(); }
  function total(p) { return p.reduce(function (s, a) { return s + a.prix * a.qte; }, 0); }
  function nb(p) { return p.reduce(function (s, a) { return s + a.qte; }, 0); }

  /* ---------- styles ---------- */
  var css = document.createElement('style');
  css.textContent =
    '#kiboPanierBtn{position:relative;background:none;border:none;cursor:pointer;padding:4px;color:inherit;display:inline-flex;align-items:center;font:inherit}' +
    '#kiboPanierBtn:hover{opacity:.6}' +
    '#kiboPanierBtn svg{width:18px;height:18px;stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round;display:block}' +
    '#kiboPanierBtn.flottant{position:fixed;right:22px;bottom:22px;z-index:9000;width:56px;height:56px;border-radius:50%;background:#1B1E24;color:#E6E6E6;justify-content:center;box-shadow:0 6px 24px rgba(27,30,36,.25);padding:0}' +
    '#kiboPanierBtn.flottant svg{width:22px;height:22px}' +
    '#kiboPanierBadge{position:absolute;top:-5px;right:-7px;background:#0F2FA6;color:#fff;border-radius:50%;min-width:16px;height:16px;font-size:9px;line-height:16px;text-align:center;font-family:inherit;display:block}' +
    '#kiboVoile{position:fixed;inset:0;background:rgba(27,30,36,.45);z-index:9001;opacity:0;pointer-events:none;transition:opacity .3s}' +
    '#kiboVoile.ouvert{opacity:1;pointer-events:auto}' +
    '#kiboTiroir{position:fixed;top:0;right:0;bottom:0;width:min(420px,94vw);background:#E6E6E6;color:#1B1E24;z-index:9002;transform:translateX(105%);transition:transform .35s ease;display:flex;flex-direction:column;font-size:13px}' +
    '#kiboTiroir.ouvert{transform:none}' +
    '#kiboTiroir header{display:flex;justify-content:space-between;align-items:center;padding:20px 22px;border-bottom:1px solid rgba(27,30,36,.15)}' +
    '#kiboTiroir header h2{font-size:12px;text-transform:uppercase;letter-spacing:.18em;margin:0}' +
    '#kiboFermer{background:none;border:none;font-size:20px;cursor:pointer;color:inherit;line-height:1}' +
    '#kiboLignes{flex:1;overflow-y:auto;padding:10px 22px}' +
    '.kibo-ligne{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid rgba(27,30,36,.1)}' +
    '.kibo-ligne img{width:64px;height:64px;object-fit:cover;background:#DCDCDC}' +
    '.kibo-ligne .inf{flex:1;min-width:0}' +
    '.kibo-ligne .nom{text-transform:uppercase;letter-spacing:.08em;font-size:11px;margin:0 0 2px}' +
    '.kibo-ligne .taille{font-size:10px;color:rgba(27,30,36,.6);text-transform:uppercase;letter-spacing:.12em}' +
    '.kibo-ligne .prix{font-size:12px;margin-top:6px}' +
    '.kibo-qte{display:flex;align-items:center;gap:10px;margin-top:8px}' +
    '.kibo-qte button{width:22px;height:22px;border:1px solid rgba(27,30,36,.3);background:none;cursor:pointer;font:inherit;line-height:1}' +
    '.kibo-suppr{background:none;border:none;cursor:pointer;font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:rgba(27,30,36,.55);padding:0;margin-top:8px;text-decoration:underline}' +
    '#kiboPied{padding:18px 22px;border-top:1px solid rgba(27,30,36,.15)}' +
    '#kiboTotal{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px}' +
    '#kiboLivraison{font-size:10px;color:rgba(27,30,36,.6);margin-bottom:14px}' +
    '#kiboPayer{width:100%;background:#1B1E24;color:#E6E6E6;border:none;padding:15px 0;font:inherit;font-size:12px;text-transform:uppercase;letter-spacing:.18em;cursor:pointer}' +
    '#kiboPayer:hover{opacity:.85}' +
    '#kiboVide{text-align:center;padding:60px 0;color:rgba(27,30,36,.55);font-size:12px;text-transform:uppercase;letter-spacing:.14em}' +
    '#kiboToast{position:fixed;left:50%;bottom:96px;transform:translateX(-50%) translateY(20px);background:#1B1E24;color:#E6E6E6;padding:10px 22px;font-size:11px;text-transform:uppercase;letter-spacing:.16em;z-index:9003;opacity:0;transition:all .3s;pointer-events:none}' +
    '#kiboToast.visible{opacity:1;transform:translateX(-50%)}';
  document.head.appendChild(css);

  /* ---------- DOM ---------- */
  var btn = document.createElement('button');
  btn.id = 'kiboPanierBtn';
  btn.setAttribute('aria-label', 'Panier');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg><span id="kiboPanierBadge">0</span>';
  var voile = document.createElement('div'); voile.id = 'kiboVoile';
  var tiroir = document.createElement('aside'); tiroir.id = 'kiboTiroir';
  tiroir.innerHTML = '<header><h2>Votre panier</h2><button id="kiboFermer" aria-label="Fermer">✕</button></header><div id="kiboLignes"></div><div id="kiboPied"><div id="kiboTotal"><span>Total</span><span id="kiboTotalVal"></span></div><div id="kiboLivraison">Livraison offerte en France dès 120 € — calculée au paiement.</div><button id="kiboPayer">Passer au paiement</button></div>';
  var toast = document.createElement('div'); toast.id = 'kiboToast';
  var logoNav = document.querySelector('.logo-nav');
  if (logoNav) {
    logoNav.insertAdjacentElement('afterend', btn);
    var navEl = logoNav.closest('nav');
    if (navEl) navEl.style.gridTemplateColumns = 'auto auto 1fr auto';
    btn.style.marginLeft = '4px';
  } else {
    var navDroite = document.querySelector('.nav-droite');
    if (navDroite) { navDroite.insertBefore(btn, navDroite.querySelector('.loupe') || null); }
    else { btn.classList.add('flottant'); document.body.appendChild(btn); }
  }
  document.body.appendChild(voile); document.body.appendChild(tiroir); document.body.appendChild(toast);

  function majBadge() {
    var n = nb(lire());
    var badge = document.getElementById('kiboPanierBadge');
    badge.textContent = n;
    if (btn.classList.contains('flottant')) btn.style.display = n > 0 ? 'inline-flex' : 'none';
  }
  function euros(n) { return (n % 1 ? n.toFixed(2).replace('.', ',') : n) + ' €'; }

  function rendre() {
    var p = lire();
    var zone = document.getElementById('kiboLignes');
    if (!p.length) { zone.innerHTML = '<div id="kiboVide">Votre panier est vide</div>'; }
    else {
      zone.innerHTML = p.map(function (a, i) {
        return '<div class="kibo-ligne">' +
          (a.img ? '<img src="' + a.img + '" alt="">' : '') +
          '<div class="inf"><p class="nom">' + a.titre + '</p>' +
          (a.taille ? '<span class="taille">' + a.taille + '</span>' : '') +
          '<div class="prix">' + euros(a.prix) + '</div>' +
          '<div class="kibo-qte"><button data-i="' + i + '" data-d="-1">−</button><span>' + a.qte + '</span><button data-i="' + i + '" data-d="1">+</button></div>' +
          '<button class="kibo-suppr" data-i="' + i + '">Retirer</button></div></div>';
      }).join('');
    }
    document.getElementById('kiboTotalVal').textContent = euros(total(p));
    document.getElementById('kiboPayer').style.display = p.length ? 'block' : 'none';
    majBadge();
  }

  function ouvrir() { rendre(); tiroir.classList.add('ouvert'); voile.classList.add('ouvert'); }
  function fermer() { tiroir.classList.remove('ouvert'); voile.classList.remove('ouvert'); }

  btn.addEventListener('click', ouvrir);
  voile.addEventListener('click', fermer);
  document.getElementById('kiboFermer').addEventListener('click', fermer);
  document.getElementById('kiboLignes').addEventListener('click', function (e) {
    var t = e.target; if (t.tagName !== 'BUTTON') return;
    var p = lire(); var i = +t.dataset.i;
    if (t.classList.contains('kibo-suppr')) p.splice(i, 1);
    else { p[i].qte += +t.dataset.d; if (p[i].qte <= 0) p.splice(i, 1); }
    ecrire(p); rendre();
  });
  document.getElementById('kiboPayer').addEventListener('click', function () {
    var p = lire(); if (!p.length) return;
    var frag = p.map(function (a) { return a.id + ':' + a.qte; }).join(',');
    window.location.href = SHOP + '/cart/' + frag;
  });

  window.KiboPanier = {
    ajouter: function (art) {
      var p = lire();
      var ex = p.find(function (a) { return a.id === art.id; });
      if (ex) ex.qte += 1; else { art.qte = 1; p.push(art); }
      ecrire(p);
      toast.textContent = 'Ajouté au panier ✓';
      toast.classList.add('visible');
      setTimeout(function () { toast.classList.remove('visible'); }, 1600);
      setTimeout(ouvrir, 500);
    }
  };

  /* ---------- pages produit : bouton L'adopter ---------- */
  var ba = document.getElementById('btnAdopter');
  if (ba && window.KIBO_VARIANTS) {
    ba.addEventListener('click', function () {
      var btns = document.querySelectorAll('.taille-btns .taille');
      var idx = 0;
      btns.forEach(function (b, i) { if (b.classList.contains('actif')) idx = i; });
      idx = Math.min(idx, KIBO_VARIANTS.length - 1);
      var og = document.querySelector('meta[property="og:image"]');
      var h1 = document.querySelector('.info h1') || document.querySelector('h1');
      var prixEl = document.querySelector('.info .prix') || document.querySelector('.prix.apparait');
      KiboPanier.ajouter({
        id: KIBO_VARIANTS[idx],
        titre: h1 ? h1.textContent.trim() : 'Pièce KIBO',
        prix: prixEl ? parseFloat(prixEl.textContent.replace(/[^0-9,\.]/g, '').replace(',', '.')) || 0 : 0,
        taille: btns.length ? btns[idx].textContent.replace(/\s+/g, ' ').trim() : '',
        img: og ? og.content : ''
      });
    });
  }
  majBadge();
})();
