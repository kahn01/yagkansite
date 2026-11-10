/* =====================================================================
   Yağkan Madeni Yağ — SİTE AYARLARI (tek yerden yönetim)
   Saatleri, telefonu vb. SADECE burada değiştirin. Sitedeki saat tablosu,
   "şu an açık/kapalı" rozeti, alt bilgi ve Google için yapısal veri
   (JSON-LD) buradan otomatik üretilir.

   !!! ÇALIŞMA SAATLERİ GOOGLE İŞLETME PROFİLİ İLE BİREBİR AYNI OLMALI !!!
   Onaylanan saatler (2 Ekim 2026): Pazartesi–Cumartesi 08:30–18:00, Pazar kapalı.
   Saat değişirse burayı VE Google profilini aynı gün güncelleyin.
   ===================================================================== */
window.YAGKAN = {
  name: 'Yağkan Madeni Yağ',
  url: 'https://yagkan.com.tr/',
  phone: '+905326472367',
  phoneDisplay: '0532 647 23 67',
  whatsapp: '905326472367',
  street: 'Yenimahalle Mah. 5. Sk. Eski Sanayi Sitesi No:24',
  district: 'Canik',
  city: 'Samsun',
  postalCode: '55100',
  geo: { lat: 41.2749062, lng: 36.3509397 },
  mapsUrl: 'https://www.google.com/maps?cid=18019103213323980141',
  reviewUrl: 'https://g.page/r/CW2NRjnnthD6EAE/review',
  hours: {
    1: ['08:30', '18:00'],
    2: ['08:30', '18:00'],
    3: ['08:30', '18:00'],
    4: ['08:30', '18:00'],
    5: ['08:30', '18:00'],
    6: ['08:30', '18:00'],
    0: null
  },
  priceNote: 'KDV dahil',
  catalogCsv: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7TTSVHmU-i_IAX3ldiYT2yBubRv22yTlQ7VMAmNoueTywHmIG97zE0dlbBRZ1S92FaA8JJBaIHB6M/pub?output=csv'
};
/* ===================== AYARLARIN SONU ===================== */

(function () {
  var C = window.YAGKAN;
  var DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  var SCHEMA_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var ORDER = [1, 2, 3, 4, 5, 6, 0];
  var $ = function (id) { return document.getElementById(id); };
  var dot = function (t) { return t.replace(':', '.'); };
  var toMin = function (t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; };

  function groups() {
    var out = [];
    ORDER.forEach(function (d) {
      var h = C.hours[d], key = h ? h.join('-') : 'x', last = out[out.length - 1];
      if (last && last.key === key) last.days.push(d); else out.push({ key: key, h: h, days: [d] });
    });
    return out;
  }
  function dayLabel(g) {
    return g.days.length > 1 ? DAYS[g.days[0]] + ' – ' + DAYS[g.days[g.days.length - 1]] : DAYS[g.days[0]];
  }

  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
  var g = function (t) { return parts.find(function (x) { return x.type === t; }).value; };
  var today = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[g('weekday')];
  var now = (parseInt(g('hour'), 10) % 24) * 60 + parseInt(g('minute'), 10);

  var tbl = $('hoursTable');
  if (tbl) {
    tbl.innerHTML = groups().map(function (gr) {
      var isToday = gr.days.indexOf(today) > -1;
      return '<tr' + (isToday ? ' class="today"' : '') + '><td>' + dayLabel(gr) + '</td><td>' +
        (gr.h ? dot(gr.h[0]) + ' – ' + dot(gr.h[1]) : 'Kapalı') + '</td></tr>';
    }).join('');
  }
  var short = groups().map(function (gr) {
    var ab = function (d) { return ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][d]; };
    var lbl = gr.days.length > 1 ? ab(gr.days[0]) + '–' + ab(gr.days[gr.days.length - 1]) : ab(gr.days[0]);
    return lbl + ' ' + (gr.h ? dot(gr.h[0]) + '–' + dot(gr.h[1]) : 'kapalı');
  }).join(' · ');
  document.querySelectorAll('[data-hours-short]').forEach(function (el) { el.textContent = short; });

  var st = $('status');
  if (st) {
    var h = C.hours[today], open = !!h && now >= toMin(h[0]) && now < toMin(h[1]), text;
    if (open) text = 'Şu an açık · Kapanış ' + dot(h[1]);
    else {
      var nextTxt = '';
      for (var i = 0; i < 8; i++) {
        var d = (today + i) % 7, hh = C.hours[d];
        if (!hh) continue;
        if (i === 0 && now >= toMin(hh[0])) continue;
        nextTxt = (i === 0 ? 'bugün ' : i === 1 ? 'yarın ' : DAYS[d] + ' ') + dot(hh[0]);
        break;
      }
      text = 'Şu an kapalı' + (nextTxt ? ' · Açılış ' + nextTxt : '');
    }
    st.className = 'status ' + (open ? 'open' : 'closed');
    $('statusText').textContent = text;
  }

  if (document.body.hasAttribute('data-ld')) {
    var ld = {
      '@context': 'https://schema.org',
      '@type': 'AutoPartsStore',
      '@id': C.url + '#isletme',
      name: C.name,
      url: C.url,
      telephone: C.phone,
      image: [C.url + 'img/hero-yag-reyonu-697.webp', C.url + 'img/og-yagkan.jpg'],
      logo: C.url + 'icon-512.png',
      description: 'Samsun Canik Eski Sanayi Sitesi\'nde madeni yağ: kamyon ve ağır vasıta, traktör, binek ve motosiklet motor yağları, şanzıman ve hidrolik yağları, antifriz, fren hidroliği, gres; ayrıca cıvata, filtre ve hırdavat. Toptan alımlarda toptan fiyat.',
      address: { '@type': 'PostalAddress', streetAddress: C.street, addressLocality: C.district, addressRegion: C.city, postalCode: C.postalCode, addressCountry: 'TR' },
      geo: { '@type': 'GeoCoordinates', latitude: C.geo.lat, longitude: C.geo.lng },
      hasMap: C.mapsUrl,
      sameAs: [C.mapsUrl],
      areaServed: { '@type': 'City', name: 'Samsun' },
      priceRange: 'TL',
      currenciesAccepted: 'TRY',
      paymentAccepted: 'Nakit, Kredi Kartı, Banka Havalesi',
      knowsAbout: ['Motor yağı', 'Hidrolik yağ', 'Şanzıman yağı', 'Antifriz', 'Fren hidroliği', 'Cıvata', 'Filtre', 'Hırdavat'],
      openingHoursSpecification: groups().filter(function (gr) { return gr.h; }).map(function (gr) {
        return { '@type': 'OpeningHoursSpecification', dayOfWeek: gr.days.map(function (d) { return SCHEMA_DAYS[d]; }), opens: gr.h[0], closes: gr.h[1] };
      })
    };
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);

    // Breadcrumb
    var breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: C.url },
        { '@type': 'ListItem', position: 2, name: 'Ürün Kataloğu', item: C.url + 'urunler.html' }
      ]
    };
    var b = document.createElement('script');
    b.type = 'application/ld+json';
    b.textContent = JSON.stringify(breadcrumb);
    document.head.appendChild(b);
  }
})();
