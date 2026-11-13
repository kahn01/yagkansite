(function(){
'use strict';
var form=document.getElementById('oilFinder');
if(!form)return;
form.addEventListener('submit',function(event){
 event.preventDefault();
 if(!form.reportValidity())return;
 var data=new FormData(form);
 var lines=['Merhaba, aracım için uygun motor yağını öğrenmek istiyorum:'];
 data.forEach(function(value,key){if(String(value).trim())lines.push(key+': '+String(value).trim());});
 lines.push('Uygun viskoziteyi, üretici onayını ve yağ miktarını teyit edebilir misiniz?');
 var url='https://wa.me/905326472367?text='+encodeURIComponent(lines.join('\n'));
 window.open(url,'_blank','noopener');
});
})();