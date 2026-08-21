/* KIBO Paris — panier (localStorage + permalink checkout Shopify) */
(function () {
  var SHOP = 'https://djcwtp-ui.myshopify.com';
  var CLE = 'kibo_panier';
  var EN = location.pathname.indexOf('/en/') === 0;
  var DEVISE = (function(){ try { return localStorage.getItem('kibo_devise') || 'EUR'; } catch(e){ return 'EUR'; } })();
  var TAUX = { EUR: 1, USD: 1.16, GBP: 0.87 };
  var SYM = { EUR: '\u20ac', USD: '$', GBP: '\u00a3' };
  var L = EN ? {
    panier: 'Your cart', vide: 'Your cart is empty', retirer: 'Remove', payer: 'Checkout', total: 'Total',
    livraison: 'Free shipping in France over 120 \u20ac \u2014 calculated at checkout.',
    noteDevise: ' Payment is charged in euros.',
    ajoute: 'Added to cart \u2713', epuise: 'Sold out \u2014 back soon',
    reassort: 'Tell me when it returns \u2709', reassortSujet: 'Restock \u2014 ', reassortCorps: 'Hello, please let me know when this piece returns: ',
    surmesure: 'Something particular in mind? The atelier makes to order \u2192', surmesureCourt: 'Made to order',
    assortiB: 'The matching bracelet', assortiC: 'The matching necklace',
    piece: 'KIBO piece'
  } : {
    panier: 'Votre panier', vide: 'Votre panier est vide', retirer: 'Retirer', payer: 'Passer au paiement', total: 'Total',
    livraison: 'Livraison offerte en France d\u00e8s 120 \u20ac \u2014 calcul\u00e9e au paiement.',
    noteDevise: ' Paiement d\u00e9bit\u00e9 en euros.',
    ajoute: 'Ajout\u00e9 au panier \u2713', epuise: '\u00c9puis\u00e9 \u2014 revient bient\u00f4t',
    reassort: 'Me pr\u00e9venir du r\u00e9assort \u2709', reassortSujet: 'R\u00e9assort \u2014 ', reassortCorps: 'Bonjour, pr\u00e9venez-moi quand cette pi\u00e8ce revient : ',
    surmesure: 'Une envie particuli\u00e8re ? L\'atelier cr\u00e9e sur mesure \u2192', surmesureCourt: 'Sur mesure',
    assortiB: 'Le bracelet assorti', assortiC: 'Le collier assorti',
    piece: 'Pi\u00e8ce KIBO'
  };

  function lire() { try { return JSON.parse(localStorage.getItem(CLE)) || []; } catch (e) { return []; } }
  function ecrire(p) { localStorage.setItem(CLE, JSON.stringify(p)); majBadge(); }
  function total(p) { return p.reduce(function (s, a) { return s + a.prix * a.qte; }, 0); }
  function nb(p) { return p.reduce(function (s, a) { return s + a.qte; }, 0); }

  /* ---------- styles ---------- */
  var css = document.createElement('style');
  css.textContent =
    /* Nav v9 : logo au centre, menu à droite ; mobile = burger | logo | panier + loupe */
    'nav{grid-template-columns:1fr auto 1fr !important;gap:16px !important}' +
    '@media (max-width:1180px){nav{grid-template-columns:1fr 1fr !important}}' +
    '.kibo-nav-gauche{grid-column:1;grid-row:1;display:flex;align-items:center;justify-content:flex-start}' +
    'nav>.logo-nav{grid-row:1}' +
    'nav>.logo-nav{grid-column:1;justify-self:start !important;display:flex;align-items:center;position:static;transform:none}' +
    '@media (max-width:1180px){nav>.logo-nav{grid-area:auto;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);justify-self:center !important}}' +
    'nav{position:sticky}' +
    '@media (max-width:1180px){.nav-droite .nav-centre{display:none !important}.kibo-nav-gauche .burger{display:block}}' +
    '.nav-droite{grid-column:3;grid-row:1;display:flex;align-items:center;justify-content:flex-end;gap:22px;order:0 !important}' +
    'nav>.nav-centre{grid-column:2;grid-row:1;display:flex;gap:22px;white-space:nowrap;font-size:11px;letter-spacing:.11em;justify-content:center}' +
    '@media (max-width:1180px){.nav-droite{grid-column:2}nav>.nav-centre{display:none !important}}' +
    '.nav-droite .nav-centre{display:flex;gap:18px;margin-right:4px;white-space:nowrap;font-size:11px;letter-spacing:.11em}' +
    '.nav-droite{gap:16px;min-width:0}' +
    '@media (max-width:900px){.nav-droite .nav-centre{display:none !important}.nav-droite{gap:14px}.kibo-nav-gauche .burger{display:block}nav{padding-left:18px !important;padding-right:18px !important}}' +
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
    '#kiboToast.visible{opacity:1;transform:translateX(-50%)}' +
    '.taille.kibo-epuise{opacity:.35;text-decoration:line-through;pointer-events:none}' +
    '#btnAdopter.kibo-epuise{opacity:.45;pointer-events:none}' +
    '.kibo-surmesure{display:block;margin-top:14px;font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:rgba(27,30,36,.6)}' +
    '.kibo-surmesure:hover{opacity:.7}' +
    '.kibo-sel{display:flex;align-items:center;gap:8px;font-size:10px;letter-spacing:.14em;text-transform:uppercase}' +
    '.kibo-sel a{opacity:.5}.kibo-sel a.actif{opacity:1;border-bottom:1px solid currentColor}' +
    '.kibo-sel-sep{opacity:.4}' +
    '.kibo-sel select{background:none;border:none;font-family:inherit;font-size:11px;letter-spacing:.1em;color:inherit;cursor:pointer;-webkit-appearance:none;appearance:none;padding:2px}' +
    '@media (max-width:900px){.kibo-sel{gap:6px}.nav-droite .kibo-sel a{display:inline-block !important}}' +
    '.kibo-parure{display:flex;align-items:center;gap:14px;margin-top:16px;border:1px solid rgba(27,30,36,.18);padding:12px 14px;text-decoration:none}' +
    '.kibo-parure:hover{border-color:#1B1E24;opacity:1}' +
    '.kibo-parure img{width:54px;height:54px;object-fit:cover;background:#DCDCDC}' +
    '.kibo-parure .kp-inf{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}' +
    '.kibo-parure .kp-label{font-size:9px;text-transform:uppercase;letter-spacing:.16em;color:#0F2FA6}' +
    '.kibo-parure .kp-nom{font-size:11px;text-transform:uppercase;letter-spacing:.1em}' +
    '.kibo-parure .kp-prix{font-size:11px;color:rgba(27,30,36,.6)}' +
    '.kibo-parure .kp-fleche{font-size:14px}' +
    '.kibo-reassort{display:inline-block;margin-top:12px;font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:rgba(27,30,36,.65);text-decoration:underline}';
  document.head.appendChild(css);

  /* ---------- DOM ---------- */
  var btn = document.createElement('button');
  btn.id = 'kiboPanierBtn';
  btn.setAttribute('aria-label', 'Panier');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg><span id="kiboPanierBadge">0</span>';
  var voile = document.createElement('div'); voile.id = 'kiboVoile';
  var tiroir = document.createElement('aside'); tiroir.id = 'kiboTiroir';
  tiroir.innerHTML = '<header><h2>' + L.panier + '</h2><button id="kiboFermer" aria-label="Fermer">✕</button></header><div id="kiboLignes"></div><div id="kiboPied"><div id="kiboTotal"><span>' + L.total + '</span><span id="kiboTotalVal"></span></div><div id="kiboLivraison">' + L.livraison + (DEVISE !== 'EUR' ? L.noteDevise : '') + '</div><button id="kiboPayer">' + L.payer + '</button></div>';
  var toast = document.createElement('div'); toast.id = 'kiboToast';
  var navEl = document.querySelector('nav');
  var logoNav = document.querySelector('.logo-nav');
  var navDroiteK = document.querySelector('.nav-droite');
  if (navEl && logoNav && navDroiteK) {
    /* 1. colonne gauche : le burger (visible mobile uniquement) */
    var gauche = document.createElement('div');
    gauche.className = 'kibo-nav-gauche';
    var burger = navDroiteK.querySelector('.burger');
    if (burger) gauche.appendChild(burger);
    navEl.insertBefore(gauche, navEl.firstChild);
    /* 2. logo au centre, enfant direct de nav */
    navEl.insertBefore(logoNav, gauche.nextSibling);
    /* 3. colonne droite : menu (desktop) + panier + loupe */
    var paris = Array.prototype.slice.call(navDroiteK.querySelectorAll('a')).filter(function (a) { return /Paris/i.test(a.textContent); })[0];
    if (paris) paris.remove();
    var centre = navEl.querySelector('.nav-centre');
    navDroiteK.insertBefore(btn, navDroiteK.querySelector('.loupe') || null);
    if (centre) navEl.appendChild(centre);
    navEl.appendChild(navDroiteK);
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
  function euros(n) {
    var v = n * TAUX[DEVISE];
    if (DEVISE !== 'EUR') { v = Math.round(v); return SYM[DEVISE] + v; }
    return (v % 1 ? v.toFixed(2).replace('.', ',') : v) + ' €';
  }

  function rendre() {
    var p = lire();
    var zone = document.getElementById('kiboLignes');
    if (!p.length) { zone.innerHTML = '<div id="kiboVide">' + L.vide + '</div>'; }
    else {
      zone.innerHTML = p.map(function (a, i) {
        return '<div class="kibo-ligne">' +
          (a.img ? '<img src="' + a.img + '" alt="">' : '') +
          '<div class="inf"><p class="nom">' + a.titre + '</p>' +
          (a.taille ? '<span class="taille">' + a.taille + '</span>' : '') +
          '<div class="prix">' + euros(a.prix) + '</div>' +
          '<div class="kibo-qte"><button data-i="' + i + '" data-d="-1">−</button><span>' + a.qte + '</span><button data-i="' + i + '" data-d="1">+</button></div>' +
          '<button class="kibo-suppr" data-i="' + i + '">' + L.retirer + '</button></div></div>';
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
    if (window.fbq) fbq('track', 'InitiateCheckout', { currency: 'EUR', value: total(p), num_items: nb(p) });
    var frag = p.map(function (a) { return a.id + ':' + a.qte; }).join(',');
    window.location.href = SHOP + '/cart/' + frag;
  });

  window.KiboPanier = {
    ajouter: function (art) {
      var p = lire();
      var ex = p.find(function (a) { return a.id === art.id; });
      if (ex) ex.qte += 1; else { art.qte = 1; p.push(art); }
      ecrire(p);
      if (window.fbq) fbq('track', 'AddToCart', { content_ids: [String(art.id)], content_type: 'product', currency: 'EUR', value: art.prix });
      toast.textContent = L.ajoute;
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
        titre: h1 ? h1.textContent.trim() : L.piece,
        prix: prixEl ? parseFloat(prixEl.textContent.replace(/[^0-9,\.]/g, '').replace(',', '.')) || 0 : 0,
        taille: btns.length ? btns[idx].textContent.replace(/\s+/g, ' ').trim() : '',
        img: og ? og.content : ''
      });
    });
  }
  /* ---------- disponibilite en direct depuis Shopify ---------- */
  if (ba && window.KIBO_VARIANTS) {
    var handle = location.pathname.split('/').pop().replace('.html', '').replace(/^produit-/, '');
    fetch(SHOP + '/products/' + handle + '.js').then(function (r) { return r.json(); }).then(function (prod) {
      var dispo = {};
      prod.variants.forEach(function (v) { dispo[v.id] = v.available; });
      var btns = document.querySelectorAll('.taille-btns .taille');
      var reste = false;
      KIBO_VARIANTS.forEach(function (id, i) {
        if (dispo[id] === false) { if (btns[i]) { btns[i].classList.add('kibo-epuise'); } }
        else { reste = true; }
      });
      var actIdx = -1;
      btns.forEach(function (b, i) { if (b.classList.contains('actif')) actIdx = i; });
      if (actIdx >= 0 && dispo[KIBO_VARIANTS[actIdx]] === false) {
        for (var i = 0; i < KIBO_VARIANTS.length; i++) {
          if (dispo[KIBO_VARIANTS[i]] !== false && btns[i]) {
            btns.forEach(function (x) { x.classList.remove('actif'); });
            btns[i].classList.add('actif');
            break;
          }
        }
      }
      if (!reste) { ba.textContent = L.epuise; ba.classList.add('kibo-epuise'); }
      var unEpuise = KIBO_VARIANTS.some(function (id) { return dispo[id] === false; });
      if (unEpuise && !document.querySelector('.kibo-reassort')) {
        var titre = (document.querySelector('.info h1') || { textContent: document.title }).textContent.trim();
        var lien = document.createElement('a');
        lien.className = 'kibo-reassort';
        lien.href = 'mailto:hello@atelier-kibo.com?subject=' + encodeURIComponent(L.reassortSujet + titre) + '&body=' + encodeURIComponent(L.reassortCorps + titre + ' — ' + location.href.split('?')[0]);
        lien.textContent = L.reassort;
        ba.insertAdjacentElement('afterend', lien);
      }
    }).catch(function () {});
  }

  majBadge();

  /* ---------- sur mesure : accès discrets ---------- */
  if (ba && !document.querySelector('.kibo-surmesure')) {
    var sm = document.createElement('a');
    sm.className = 'kibo-surmesure';
    sm.href = 'sur-mesure.html';
    sm.textContent = L.surmesure;
    ba.insertAdjacentElement('afterend', sm);
  }
  var fl = document.querySelector('.footer-liens');
  if (fl && !fl.querySelector('a[href="sur-mesure.html"]')) {
    var fsm = document.createElement('a');
    fsm.href = 'sur-mesure.html';
    fsm.textContent = L.surmesureCourt;
    fl.appendChild(fsm);
  }

  /* ---------- la parure : collier et bracelet assortis ---------- */
  var PAIRES = ['palermo', 'casablanca', 'rio', 'positano', 'ibiza', 'laguna', 'tahiti'];
  if (ba) {
    var hp = location.pathname.split('/').pop().replace('.html', '').replace(/^produit-/, '');
    var estBracelet = /-bracelet$/.test(hp);
    var baseP = estBracelet ? hp.replace(/-bracelet$/, '') : hp;
    if (PAIRES.indexOf(baseP) !== -1) {
      var autreHandle = estBracelet ? baseP : baseP + '-bracelet';
      var autrePage = 'produit-' + autreHandle;
      var prefixeImg = EN ? '../' : '';
      fetch(SHOP + '/products/' + autreHandle + '.js').then(function (r) { return r.json(); }).then(function (prod) {
        var px = prod.variants[0].price;
        if (px >= 1000) px = px / 100;
        var carte = document.createElement('a');
        carte.className = 'kibo-parure';
        carte.href = autrePage + '.html';
        carte.innerHTML = '<img src="' + prefixeImg + autrePage + '.jpg?v=4" alt="">' +
          '<span class="kp-inf"><span class="kp-label">' + (estBracelet ? L.assortiC : L.assortiB) + '</span>' +
          '<span class="kp-nom">' + prod.title + '</span>' +
          '<span class="kp-prix">' + euros(px) + '</span></span>' +
          '<span class="kp-fleche">\u2192</span>';
        ba.insertAdjacentElement('afterend', carte);
      }).catch(function () {});
    }
  }

  /* ---------- sélecteur langue + devise ---------- */
  var navD2 = document.querySelector('.nav-droite');
  if (navD2 && !document.querySelector('.kibo-sel')) {
    var sel = document.createElement('div');
    sel.className = 'kibo-sel';
    var cheminFR = EN ? location.pathname.replace(/^\/en\//, '/') : location.pathname;
    var cheminEN = EN ? location.pathname : ('/en' + (location.pathname === '/' ? '/' : location.pathname));
    sel.innerHTML = '<a href="' + cheminFR + '"' + (EN ? '' : ' class="actif"') + '>FR</a><span class="kibo-sel-sep">/</span><a href="' + cheminEN + '"' + (EN ? ' class="actif"' : '') + '>EN</a>' +
      '<select id="kiboDevise" aria-label="Devise"><option value="EUR">\u20ac</option><option value="USD">$</option><option value="GBP">\u00a3</option></select>';
    navD2.insertBefore(sel, navD2.firstChild);
    var selD = document.getElementById('kiboDevise');
    selD.value = DEVISE;
    selD.addEventListener('change', function () {
      try { localStorage.setItem('kibo_devise', selD.value); } catch (e) {}
      location.reload();
    });
  }
  if (DEVISE !== 'EUR') {
    var marche = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (nd) {
        var p = nd.parentElement && nd.parentElement.tagName;
        if (p === 'SCRIPT' || p === 'STYLE' || p === 'SELECT' || p === 'OPTION') return NodeFilter.FILTER_REJECT;
        return /\d\s?\u20ac/.test(nd.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    var noeuds = [];
    while (marche.nextNode()) noeuds.push(marche.currentNode);
    noeuds.forEach(function (nd) {
      nd.nodeValue = nd.nodeValue.replace(/(\d[\d\s]*(?:[.,]\d+)?)\s?\u20ac/g, function (m0, num) {
        var e = parseFloat(num.replace(/\s/g, '').replace(',', '.'));
        if (isNaN(e)) return m0;
        return SYM[DEVISE] + Math.round(e * TAUX[DEVISE]);
      });
    });
  }

  /* ---------- cercle : envoi des emails vers Shopify (popup + page Private Access) ---------- */
  ['popupForm', 'formCercle'].forEach(function (fid) {
    var pf = document.getElementById(fid);
    if (!pf) return;
    pf.addEventListener('submit', function () {
      var champ = pf.querySelector('input[name="EMAIL"]');
      if (!champ || !champ.value || champ.value.indexOf('@') < 0) return;
      var fd = new FormData();
      fd.append('form_type', 'customer');
      fd.append('utf8', '✓');
      fd.append('contact[email]', champ.value);
      fd.append('contact[tags]', 'cercle');
      fetch(SHOP + '/contact', { method: 'POST', body: fd, mode: 'no-cors' });
    });
  });

  /* ---------- pixel Meta ---------- */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '1680970543594063');
  fbq('track', 'PageView');
  if (ba && window.KIBO_VARIANTS) {
    var prixVC = document.querySelector('.info .prix');
    fbq('track', 'ViewContent', {
      content_ids: KIBO_VARIANTS.map(String),
      content_type: 'product',
      currency: 'EUR',
      value: prixVC ? parseFloat(prixVC.textContent.replace(/[^0-9,\.]/g, '').replace(',', '.')) || 0 : 0
    });
  }

  /* ---------- stats de visite (Cloudflare Web Analytics) ---------- */
  var cf = document.createElement('script');
  cf.defer = true;
  cf.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  cf.setAttribute('data-cf-beacon', '{"token": "de1a2bf33b51446dbc2b18b04e5d24f6"}');
  document.head.appendChild(cf);
})();
