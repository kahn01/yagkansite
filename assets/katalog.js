/* Yağkan Madeni Yağ — ürün kataloğu (Google E-Tablo CSV'sinden okunur)
   Dayanıklılık: UTF-8 zorunlu çözümleme, bozuk karakter (Ã/Ä) onarımı, boş satır atlama,
   başlık adlarında esneklik, ₺ fiyat biçimi, görsel yoksa/yüklenemezse şık yedek görünüm. */
(function () {
  var C = window.YAGKAN || {};
  var CSV_URL = C.catalogCsv;
  var WA = C.whatsapp || '905326472367';
  var FILTERS = [['marka', 'Marka'], ['viskozite', 'Viskozite'], ['ambalaj', 'Ambalaj'], ['hacim', 'Hacim'], ['tur', 'Tür'], ['malzeme', 'Malzeme'], ['olcu', 'Ölçü'], ['arac', 'Araç']];
  // Tablodaki başlık adları farklı yazılsa da tanınsın (anahtarlar sadeleştirilmiş haldir)
  var ALIAS = { urun: 'ad', urunadi: 'ad', isim: 'ad', adi: 'ad', name: 'ad', fiyattl: 'fiyat', fiyati: 'fiyat', tl: 'fiyat', fotograf: 'foto', gorsel: 'foto', resim: 'foto', resimurl: 'foto', image: 'foto', stokdurumu: 'stok', tip: 'tur', turu: 'tur', olculer: 'olcu', litre: 'hacim', miktar: 'hacim', kategorisi: 'kategori', grup: 'kategori' };
  var items = [], state = { cat: '', q: '', f: {} };
  var $ = function (id) { return document.getElementById(id); };
  var norm = function (s) { return (s || '').toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim(); };
  function slug(s) {
    return norm(s).replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]/g, '');
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // --- Bozuk karakter onarımı ("YaÄŸ" -> "Yağ", "Ã¼" -> "ü", "â‚º" -> "₺") ---
  var CP1252 = { 0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F };
  function byteOf(ch) { var c = ch.charCodeAt(0); if (c < 256) return c; return CP1252[c] !== undefined ? CP1252[c] : -1; }
  var CONT = '[\\u0080-\\u00BF\\u20AC\\u201A\\u0192\\u201E\\u2026\\u2020\\u2021\\u02C6\\u2030\\u0160\\u2039\\u0152\\u017D\\u2018\\u2019\\u201C\\u201D\\u2022\\u2013\\u2014\\u02DC\\u2122\\u0161\\u203A\\u0153\\u017E\\u0178]';
  var MOJI = new RegExp('[\\u00C2-\\u00DF]' + CONT + '|[\\u00E0-\\u00EF]' + CONT + '{2}', 'g');
  var dec = new TextDecoder('utf-8', { fatal: true });
  function fixText(s) {
    if (!s || !/[\u00C2-\u00EF]/.test(s)) return s;
    return s.replace(MOJI, function (m) {
      var b = [];
      for (var i = 0; i < m.length; i++) { var x = byteOf(m[i]); if (x < 0) return m; b.push(x); }
      try { return dec.decode(new Uint8Array(b)); } catch (e) { return m; }
    });
  }

  function parseCSV(t) {
    var r = [], row = [], v = '', q = false, i, c;
    for (i = 0; i < t.length; i++) {
      c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { v += '"'; i++; } else q = false; } else v += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(v); v = ''; }
      else if (c === '\n') { row.push(v); r.push(row); row = []; v = ''; }
      else if (c !== '\r') v += c;
    }
    if (v || row.length) { row.push(v); r.push(row); }
    return r;
  }

  // --- Biçimlendirme ---
  var TRY0 = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  var TRY2 = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var TRY = { format: function (n) { return (n % 1 ? TRY2 : TRY0).format(n); } };
  function parsePrice(raw) {
    var s = (raw || '').replace(/₺|tl|try|\s/gi, '');
    if (!/^\d[\d.,]*$/.test(s)) return null;
    if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');        // 4.250,50
    else if (/\.\d{1,2}$/.test(s) && !/\.\d{3}/.test(s)) s = s.replace(/,/g, ''); // 4250.50
    else s = s.replace(/[.,]/g, '');                                              // 5.000 / 5,000 / 5000
    var n = parseFloat(s);
    return isFinite(n) && n > 0 ? n : null;
  }
  function priceHtml(p) {
    var raw = (p.fiyat || '').trim();
    if (!raw) return '<div class="price ask">Fiyat için sorun</div>';
    var n = parsePrice(raw);
    var note = (p.kdv || '').trim();
    if (note && !/kdv/i.test(note)) note = /hari|\+/i.test(note) ? '+ KDV' : /dahil/i.test(note) ? 'KDV dahil' : note;
    note = note || C.priceNote || '';
    if (n === null) return '<div class="price">' + esc(raw) + '</div>';
    return '<div class="price">' + TRY.format(n).replace(/\s/g, '') + (note ? '<small>' + esc(note) + '</small>' : '') + '</div>';
  }
  function unit(s) { return (s || '').replace(/(\d)\s*(lt|ltr|litre|l)\b\.?/gi, '$1 L').replace(/(\d)\s*(kg|kilo)\b/gi, '$1 kg'); }
  function nice(s) { return (s || '').replace(/ (Ve|İle|Veya) /g, function (m) { return m.toLocaleLowerCase('tr'); }); }

  function photo(u) {
    u = (u || '').trim(); if (!u) return '';
    var m = u.match(/\/d\/([\w-]+)/) || u.match(/[?&]id=([\w-]+)/);
    if (m && /drive\.google\.com/.test(u)) return 'https://lh3.googleusercontent.com/d/' + m[1] + '=w600'; // çerezsiz Drive görseli
    return /^https:\/\//.test(u) ? u : '';
  }
  function photoAlt(u) { // ilk adres açılmazsa denenecek ikinci Drive adresi
    var m = (u || '').match(/\/d\/([\w-]+)/) || (u || '').match(/[?&]id=([\w-]+)/);
    return m && /drive\.google\.com/.test(u) ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w600' : '';
  }
  var ICON_OIL = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" aria-hidden="true"><path d="M14 22h30l8 8v24H14z"/><path d="M20 22v-8h12v8"/><path d="M32 34c-4 6-6 9-6 12a6 6 0 0 0 12 0c0-3-2-6-6-12z" fill="currentColor" stroke="none"/></svg>';
  var ICON_BOLT = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" aria-hidden="true"><path d="M20 8h24l6 10-6 10H20l-6-10z"/><path d="M28 28v28h8V28"/><path d="M28 36h8M28 44h8M28 52h8"/></svg>';
  var ICON_BOX = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" aria-hidden="true"><path d="M8 20l24-12 24 12v24L32 56 8 44z"/><path d="M8 20l24 12 24-12M32 32v24"/></svg>';
  function fallback(p) {
    var k = slug(p.kategori + ' ' + p.ad + ' ' + p.tur);
    var icon = /civata|somun|vida|rondela|baglanti/.test(k) ? ICON_BOLT : /yag|gres|antifriz|hidrolik|hidrolig|sanziman|motor/.test(k) ? ICON_OIL : ICON_BOX;
    return '<div class="ph-fallback">' + icon + '<b>' + esc(p.marka || nice(p.kategori) || 'Yağkan') + '</b><small>Fotoğraf yakında</small></div>';
  }
  // Görsel yüklenemezse yedek görünüme geç
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (img.tagName === 'IMG' && img.hasAttribute('data-fb')) {
      var alt = img.getAttribute('data-alt');
      if (alt) { img.removeAttribute('data-alt'); img.src = alt; return; }
      var p = items[+img.getAttribute('data-fb')];
      if (p) img.parentNode.innerHTML = fallback(p);
    }
  }, true);

  function uniq(list) {
    var seen = {}, out = [];
    list.forEach(function (v) { v = (v || '').trim(); var k = norm(v); if (k && !seen[k]) { seen[k] = 1; out.push(v); } });
    return out.sort(function (a, b) { return a.localeCompare(b, 'tr', { numeric: true }); });
  }
  function inCat(p) { return !state.cat || norm(p.kategori) === norm(state.cat); }
  function match(p) {
    if (!inCat(p)) return false;
    for (var k in state.f) { if (state.f[k] && norm(p[k]) !== norm(state.f[k])) return false; }
    if (state.q) {
      var hay = p._hay;
      return state.q.split(' ').every(function (w) { return hay.indexOf(w) > -1 || p._slug.indexOf(slug(w)) > -1; });
    }
    return true;
  }
  function drawTabs() {
    var cats = uniq(items.map(function (p) { return p.kategori; })), h = '';
    [''].concat(cats).forEach(function (c) {
      h += '<button type="button" data-c="' + esc(c) + '" aria-pressed="' + (norm(c) === norm(state.cat)) + '">' + esc(nice(c) || 'Tümü') + '</button>';
    });
    $('tabs').innerHTML = h;
  }
  function drawFilters() {
    var pool = items.filter(inCat), h = '', n = 0;
    FILTERS.forEach(function (f) {
      var vals = uniq(pool.map(function (p) { return p[f[0]]; }));
      if (vals.length < 2) return;
      n++;
      h += '<label>' + f[1] + '<select data-f="' + f[0] + '"><option value="">Hepsi</option>' +
        vals.map(function (v) { return '<option' + (norm(state.f[f[0]]) === norm(v) ? ' selected' : '') + '>' + esc(v) + '</option>'; }).join('') + '</select></label>';
    });
    $('filters').innerHTML = h;
    $('filterbox').hidden = !n;
  }
  function drawGrid() {
    var list = items.filter(match);
    var inStock = list.filter(function (p) { return !p._out; }).length;
    $('count').textContent = list.length + ' ürün' + (inStock < list.length ? ' (' + inStock + ' stokta)' : '');
    if (!list.length) {
      $('grid').innerHTML = '<div class="msg">Aradığınız ürün katalogda görünmüyor; bu stokta olmadığı anlamına gelmez. <a href="https://wa.me/' + WA + '?text=' + encodeURIComponent('Merhaba, ' + ($('q').value || 'bir ürün') + ' var mı?') + '" target="_blank" rel="noopener"><strong>WhatsApp\'tan sorun</strong></a> veya arayın: <a href="tel:+' + WA + '">' + esc(C.phoneDisplay || '') + '</a></div>';
      return;
    }
    $('grid').innerHTML = list.map(function (p) {
      var img = photo(p.foto), idx = items.indexOf(p);
      var tags = [p.viskozite, p.ambalaj, unit(p.hacim), p.tur, p.malzeme, p.olcu, p.arac].filter(function (x) { return x && x.trim(); });
      var msg = 'Merhaba, ' + (p.ad || 'ürün') + ' hakkında bilgi almak istiyorum.';
      return '<article class="card' + (p._out ? ' is-out' : '') + '"><div class="ph">' +
        (img ? '<img src="' + esc(img) + '" alt="' + esc(p.ad) + '" width="600" height="600" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-fb="' + idx + '"' + (photoAlt(p.foto) ? ' data-alt="' + esc(photoAlt(p.foto)) + '"' : '') + '>' : fallback(p)) +
        '</div><div class="bd"><h2>' + esc(p.ad) + '</h2>' +
        (p.marka ? '<div class="brand">' + esc(p.marka) + '</div>' : '') +
        (tags.length ? '<div class="tags">' + tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
        priceHtml(p) +
        (p._out ? '<div class="out">Şu an stokta yok — sorun, temin edelim</div>' : '') +
        '<a class="btn btn-wa" target="_blank" rel="noopener" href="https://wa.me/' + WA + '?text=' + encodeURIComponent(msg) + '">WhatsApp\'tan Sor</a></div></article>';
    }).join('');
  }
  function drawAll() { drawTabs(); drawFilters(); drawGrid(); }

  $('tabs').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; state.cat = b.getAttribute('data-c'); state.f = {}; drawAll(); });
  $('filters').addEventListener('change', function (e) { state.f[e.target.getAttribute('data-f')] = e.target.value; drawGrid(); });
  $('q').addEventListener('input', function (e) { state.q = norm(e.target.value); drawGrid(); });

  // URL'den arama: urunler.html?q=15W-40
  var qp = new URLSearchParams(location.search).get('q');
  if (qp) { $('q').value = qp; state.q = norm(qp); }

  var ctrl = 'AbortController' in window ? new AbortController() : null;
  var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 12000);
  fetch(CSV_URL, ctrl ? { signal: ctrl.signal } : {})
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(function (buf) {
      clearTimeout(timer);
      var t = new TextDecoder('utf-8').decode(buf).replace(/^\uFEFF/, '');
      var rows = parseCSV(t);
      var head = (rows.shift() || []).map(function (h) { var k = slug(fixText(h)); return ALIAS[k] || k; });
      items = rows.map(function (r) {
        var o = {};
        head.forEach(function (h, i) { if (h && !o[h]) o[h] = fixText((r[i] || '').trim()); });
        return o;
      }).filter(function (o) { return o.ad; }) // adı olmayan / boş satırları atla
        .map(function (o) {
          o._out = /^(yok|0|hayır|hayir|tükendi|tukendi|no)$/i.test((o.stok || '').trim());
          o._hay = norm(Object.keys(o).filter(function (k) { return k[0] !== '_' && k !== 'foto'; }).map(function (k) { return o[k]; }).join(' '));
          o._slug = slug(o._hay);
          return o;
        });
      // aynı ürün iki kez girildiyse bir kez göster
      var seen = {};
      items = items.filter(function (p) { var k = slug([p.ad, p.hacim, p.ambalaj, p.viskozite].join('|')); if (seen[k]) return false; seen[k] = 1; return true; });
      // stokta olanlar önce (kendi sıraları korunarak)
      items = items.filter(function (p) { return !p._out; }).concat(items.filter(function (p) { return p._out; }));
      if (!items.length) { $('grid').innerHTML = '<div class="msg">Katalog şu an güncelleniyor. Ürünler için bize WhatsApp\'tan yazabilirsiniz.</div>'; return; }
      drawAll();
    })
    .catch(function () {
      clearTimeout(timer);
      $('grid').innerHTML = '<div class="msg">Ürün listesi şu an yüklenemedi. Stok ve fiyat için WhatsApp\'tan yazın veya arayın: <a href="tel:+' + WA + '">' + esc(C.phoneDisplay || '') + '</a></div>';
    });
})();
