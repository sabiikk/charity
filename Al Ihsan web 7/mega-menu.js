(()=>{
const items=[...document.querySelectorAll('#navigation .has-mega')];
if(!items.length)return;
const mobile=()=>matchMedia('(max-width:1000px)').matches;
const ar=()=>document.documentElement.lang==='ar'?1:0;
/* ---------- enrich the panels: numbered list + live image preview ---------- */
const META={
 'من نحن':['Our story, mission and values','قصتنا ورسالتنا وقيمنا','assets/community.jpg'],
 'كلمة المدير العام':['A message from our General Manager','رسالة من مديرنا العام','assets/general-manager.jpeg'],
 'كلمة رئيس مجلس الإدارة':['A message from the Chairman','رسالة من رئيس مجلس الإدارة','assets/chairman.jpeg'],
 'الأخبار':['Latest stories and updates','أحدث القصص والمستجدات','assets/news.jpg'],
 'الصور':['Photo galleries from the field','معارض صور من الميدان','assets/media-zayed.jpg'],
 'الفيديوهات':['Campaign films and messages','أفلام ورسائل الحملات','assets/food.jpg'],
 'الفعاليات':['Upcoming and past gatherings','لقاءات قادمة وسابقة','assets/volunteers.jpg'],
 'تسجيل طلب مساعدة':['Request financial assistance','اطلب مساعدة مالية','assets/hospital.jpg'],
 'بوابة أمان رمضان':['Seasonal support portal','بوابة الدعم الموسمي','assets/quran.jpg'],
 'تطوع':['Join our volunteers','انضم إلى متطوعينا','assets/volunteers.jpg'],
 'مشروع مخصص':['Name your own project','سمِّ مشروعك الخاص','assets/endowment.jpg'],
 'مشروع مشترك':['Give together with others','أعطِ مع الآخرين','assets/water.jpg'],
 'الكفالة':['Sponsor an orphan or family','اكفل يتيماً أو أسرة','assets/community.jpg']};
const EXP=['Explore','استكشف'];
const arrow='<svg class="mc-go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const HEAD=[
 {e:['AL IHSAN','الإحسان'],h:['Who we are and how we work','من نحن وكيف نعمل']},
 {e:['MEDIA CENTER','المركز الإعلامي'],h:['Stories, moments and updates','قصص ولحظات ومستجدات']},
 {e:['E-SERVICES','الخدمات الإلكترونية'],h:['Help and services, online','المساعدة والخدمات إلكترونياً']},
 {e:['SPECIAL PROJECT','مشروع خاص'],h:['Give in a way that is personal','أعطِ بطريقتك الخاصة']}];
const LAB={
 'من نحن':['About Al Ihsan','عن الإحسان','Who we are, mission, vision and milestones','من نحن ورسالتنا ورؤيتنا ومحطاتنا'],
 'كلمة رئيس مجلس الإدارة':['Chairman’s message','كلمة رئيس مجلس الإدارة','A message from the Chairman','رسالة من رئيس مجلس الإدارة'],
 'كلمة المدير العام':['General Manager’s message','كلمة المدير العام','A message from the General Manager','رسالة من المدير العام']};
const ORDER=['من نحن','كلمة رئيس مجلس الإدارة','كلمة المدير العام'];
items.forEach((item,idx)=>{
  const panel=item.querySelector('.mega-panel');if(!panel||panel.dataset.mc)return;panel.dataset.mc='1';
  let cards=[...panel.querySelectorAll('.mega-card')];
  if(idx===0)cards.sort((x,y)=>ORDER.indexOf(x.dataset.ar)-ORDER.indexOf(y.dataset.ar));
  const links=document.createElement('div');links.className='m4-links';
  cards.forEach((c,i)=>{
    const aAr=c.dataset.ar||'';c.removeAttribute('data-ar');
    const sp=c.querySelector(':scope > span'),en0=sp?sp.textContent.trim():'';
    const m=META[aAr]||['','',''];const L=LAB[aAr];
    const en=L?L[0]:en0,ara=L?L[1]:aAr,den=L?L[2]:m[0],dar=L?L[3]:m[1];
    c.innerHTML='<b data-ar="'+ara+'" data-en="'+en+'">'+(ar()?ara:en)+'</b>'+(den?'<small data-ar="'+dar+'" data-en="'+den+'">'+(ar()?dar:den)+'</small>':'');
    c.style.setProperty('--mi',i);links.appendChild(c);
  });
  const H=HEAD[idx];
  const head=document.createElement('div');head.className='m4-head';
  head.innerHTML='<span class="m4-eye" data-ar="'+H.e[1]+'" data-en="'+H.e[0]+'">'+H.e[ar()]+'</span><h3 data-ar="'+H.h[1]+'" data-en="'+H.h[0]+'">'+H.h[ar()]+'</h3>';
  panel.innerHTML='';const wrap=document.createElement('div');wrap.className='mega-wrap mg4';wrap.append(head,links);panel.appendChild(wrap);
});
/* labels must follow the page's language switch */
new MutationObserver(()=>{document.querySelectorAll('.mega-panel [data-en]').forEach(x=>x.textContent=x.dataset[ar()?'ar':'en'])}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
/* ---------- open / close ---------- */
const back=document.createElement('div');back.className='mega-backdrop';document.body.appendChild(back);
const setOn=on=>document.documentElement.classList.toggle('mega-on',on);
const closeAll=except=>{items.forEach(i=>{if(i!==except){i.classList.remove('open');i.querySelector('.nav-link').setAttribute('aria-expanded','false')}});if(!except)setOn(false)};
items.forEach(item=>{
  const btn=item.querySelector('.nav-link');
  btn.addEventListener('click',e=>{e.preventDefault();const open=!item.classList.contains('open');closeAll(item);item.classList.toggle('open',open);btn.setAttribute('aria-expanded',String(open));setOn(open&&!mobile())});
  item.addEventListener('mouseenter',()=>{if(!mobile()){closeAll(item);setOn(true)}});
  item.addEventListener('mouseleave',()=>{if(!mobile()){item.classList.remove('open');btn.setAttribute('aria-expanded','false');setOn(false)}});
});
document.addEventListener('click',e=>{if(!e.target.closest('#navigation'))closeAll()});
back.addEventListener('click',()=>closeAll());
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});
})();
/* ---------- responsive drawer: scroll lock, close on link / Esc / resize ---------- */
(()=>{
const nav=document.querySelector('#navigation'),btn=document.querySelector('.menu');if(!nav||!btn)return;
const isM=()=>matchMedia('(max-width:1000px)').matches;
const sync=()=>{const on=nav.classList.contains('open')&&isM();document.body.classList.toggle('menu-open',on);btn.setAttribute('aria-expanded',String(on))};
new MutationObserver(sync).observe(nav,{attributes:true,attributeFilter:['class']});
const close=()=>{nav.classList.remove('open');sync();nav.querySelectorAll('.has-mega.open').forEach(i=>{i.classList.remove('open');const b=i.querySelector('.nav-link');b&&b.setAttribute('aria-expanded','false')})};
nav.addEventListener('click',e=>{if(isM()&&e.target.closest('a[href]'))close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open'))close()});
document.addEventListener('click',e=>{if(isM()&&nav.classList.contains('open')&&!e.target.closest('#navigation')&&!e.target.closest('.menu'))close()});
addEventListener('resize',()=>{if(!isM()){nav.classList.remove('open');sync()}});
btn.setAttribute('aria-controls','navigation');
})();
