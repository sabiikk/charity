document.documentElement.classList.add('js');
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.1,rootMargin:'0px 0px -40px 0px'});
$$('.fade').forEach(e=>io.observe(e));
const ar=()=>document.documentElement.lang==='ar';
/* banner rotator */
const fg=$$('.pj-banner img'),dots=$$('.pj-dots i');let n=0,timer;
const show=i=>{n=(i+fg.length)%fg.length;fg.forEach((x,k)=>x.classList.toggle('on',k===n));dots.forEach((x,k)=>x.classList.toggle('on',k===n));clearTimeout(timer);timer=setTimeout(()=>show(n+1),4500)};
if(fg.length){dots.forEach((d,i)=>d.addEventListener('click',()=>show(i)));$('.pj-prev').addEventListener('click',()=>show(n-1));$('.pj-next').addEventListener('click',()=>show(n+1));show(0)}
/* wizard */
const HEAD=[
 ['01 - Choose country','01 - اختر الدولة','We have various categories under which you can start your project. Choose the relevant project category and the country from our dropdown to get started.','لدينا فئات متعددة يمكنك بدء مشروعك من خلالها. اختر فئة المشروع والدولة من القوائم للبدء.'],
 ['02 - Choose an existing similar project','02 - اختر مشروعاً قائماً مشابهاً','Pick the project that is closest to your cause. You will be able to name it in the next step.','اختر المشروع الأقرب لقضيتك، وستتمكن من تسميته في الخطوة التالية.'],
 ['03 - Name your project','03 - سمِّ مشروعك','Give your project a name — in your own name or in memory of someone you love.','أعطِ مشروعك اسماً — باسمك أو صدقة جارية عمّن تحب.'],
 ['04 - Share & Donate','04 - شارك وتبرع','Your project is ready. Share it with family and friends, then make your donation.','مشروعك جاهز. شاركه مع الأهل والأصدقاء ثم أتمّ تبرعك.']];
const wh=$('#pp-wh'),wp=$('#pp-wp'),panes=$$('.pp-pane'),sts=$$('.pp-st');let step=1,sel=null,name='';
const setHead=()=>{const h=HEAD[step-1];wh.dataset.en=h[0];wh.dataset.ar=h[1];wp.dataset.en=h[2];wp.dataset.ar=h[3];wh.textContent=ar()?h[1]:h[0];wp.textContent=ar()?h[3]:h[2]};
const go=(s,scroll=true)=>{step=s;panes.forEach(p=>p.hidden=+p.dataset.pane!==s);sts.forEach((x,i)=>{x.classList.toggle('on',i+1===s);x.classList.toggle('done',i+1<s)});setHead();
  const p=$('.pp-pane[data-pane="'+s+'"]');$$('.fade',p).forEach(e=>{e.classList.remove('visible');requestAnimationFrame(()=>requestAnimationFrame(()=>io.observe(e)))});
  if(scroll)$('#wizard').scrollIntoView({behavior:'smooth',block:'start'})};
sts.forEach((x,i)=>$('button',x).addEventListener('click',()=>{if(x.classList.contains('done'))go(i+1)}));
$$('[data-back]').forEach(b=>b.addEventListener('click',()=>go(+b.dataset.back)));
/* step 1 -> 2 */
const cards=$$('.pp-card'),pager=$('#pp-pager'),empty=$('#pp-empty'),PER=6;let page=1,match=[];
const fco=$('#pp-f-co'),fca=$('#pp-f-cat'),cnt=$('#pp-count');
const render=()=>{const co=fco.value,ca=fca.value;
  match=cards.filter(c=>(co==='all'||c.dataset.country===co)&&(ca==='all'||c.dataset.cat===ca));
  const pages=Math.max(1,Math.ceil(match.length/PER));page=Math.min(page,pages);cards.forEach(c=>c.hidden=true);
  match.slice((page-1)*PER,page*PER).forEach((c,i)=>{c.hidden=false;c.classList.remove('visible');c.style.transitionDelay=(i%3)*.1+'s';requestAnimationFrame(()=>requestAnimationFrame(()=>io.observe(c)))});
  empty.hidden=match.length>0;pager.hidden=pages<2;cnt.textContent=ar()?'تم العثور على '+match.length+' نتيجة':match.length+' results found';
  pager.innerHTML='<button data-p="prev"'+(page===1?' disabled':'')+' aria-label="Previous">'+(ar()?'›':'‹')+'</button>'+Array.from({length:pages},(_,i)=>'<button data-p="'+(i+1)+'"'+(i+1===page?' class="on"':'')+'>'+(i+1)+'</button>').join('')+'<button data-p="next"'+(page===pages?' disabled':'')+' aria-label="Next">'+(ar()?'‹':'›')+'</button>'};
pager.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const p=b.dataset.p;page=p==='prev'?page-1:p==='next'?page+1:+p;render();$('#wizard').scrollIntoView({behavior:'smooth'})});
$('#pp-go').addEventListener('click',()=>{fco.value=$('#pp-country').value;fca.value=$('#pp-cat').value;page=1;render();go(2)});
[fco,fca].forEach(x=>x.addEventListener('change',()=>{page=1;render()}));
/* step 2 -> 3 */
/* step 3 detail panel: filled from the chosen card, in the current language */
const txt=el=>!el?'':ar()&&el.dataset.ar?el.dataset.ar:(el.dataset.en||el.textContent);
const fillDetail=()=>{if(!sel)return;const t=$('h3',sel),b=$$('li b',sel),en=t.dataset.en||t.textContent,amt=(en.match(/(\d[\d,]*)\s*$/)||[])[1]||'';
  $('#pp-d-img').src=$('img',sel).src;$('#pp-d-img').alt=txt(t);$('#pp-d-title').textContent=txt(t)+(amt&&ar()?' درهم':'');
  $('#pp-d-cat').textContent=txt(b[0]);$('#pp-d-co').textContent=txt(b[1]);$('#pp-d-amt').textContent=amt?amt+(ar()?' درهم':' AED'):'—';$('#pp-d-desc').textContent=txt($('.pp-desc',sel))};
cards.forEach(c=>$('.pp-sel',c).addEventListener('click',()=>{sel=c;fillDetail();go(3)}));
$('#language').addEventListener('click',()=>setTimeout(fillDetail));
$('.pp-agree-link').addEventListener('click',e=>{e.preventDefault();const d=$('.pp-terms-box');d.open=true;d.scrollIntoView({behavior:'smooth',block:'center'})});
/* step 3 -> 4 */
const nameEl=$('#pp-name'),err=$('#pp-err');
const nameArEl=$('#pp-name-ar'),agree=$('#pp-agree');
const fail=(m,el)=>{err.textContent=m;err.hidden=false;if(el){el.setAttribute('aria-invalid','true');el.focus()}};
$('#pp-to4').addEventListener('click',()=>{const en=nameEl.value.trim(),a=nameArEl.value.trim();name=ar()?(a||en):(en||a);
  [nameEl,nameArEl].forEach(x=>x.setAttribute('aria-invalid','false'));
  if(!name)return fail(ar()?'يرجى إدخال اسم للمشروع (بالإنجليزية أو بالعربية).':'Please enter a name for your project (in English or Arabic).',nameEl);
  if(!agree.checked)return fail(ar()?'يرجى الموافقة على الشروط والأحكام.':'Please accept the Terms & Conditions.',agree);
  err.hidden=true;
  const url=location.href.split('#')[0].split('?')[0]+'?project='+encodeURIComponent(name);
  $('#pp-fname').textContent=name;$('#pp-fmeta').textContent=$$('li b',sel).map(b=>b.textContent).join(' · ');
  $('#pp-url').value=url;const txt=encodeURIComponent((ar()?'ساهم معي في مشروعي: ':'Support my project: ')+name+' '+url);
  $('#pp-wa').href='https://wa.me/?text='+txt;$('#pp-x').href='https://twitter.com/intent/tweet?text='+txt;$('#pp-fb').href='https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url);go(4)});
[nameEl,nameArEl].forEach(x=>x.addEventListener('input',()=>{if(x.value.trim())err.hidden=true}));agree.addEventListener('change',()=>{if(agree.checked)err.hidden=true});
$('#pp-copy').addEventListener('click',async e=>{const b=e.currentTarget,u=$('#pp-url');try{await navigator.clipboard.writeText(u.value)}catch{u.select();document.execCommand('copy')}const s=$('span',b),o=s.textContent;s.textContent=ar()?'تم النسخ ✓':'Copied ✓';setTimeout(()=>s.textContent=o,1600)});
$('#pp-don').addEventListener('click',e=>{e.preventDefault();window.open('https://alihsan.ae/ar/donation/direct-donation','_blank','noopener')});
/* feedback faces */
$$('.dn-face').forEach(b=>b.addEventListener('click',()=>$$('.dn-face').forEach(x=>x.classList.toggle('on',x===b))));
/* language + mobile menu */
$$('[data-ar]').forEach(e=>e.dataset.en=e.innerHTML);
nameEl.dataset.en=nameEl.placeholder;
$('#language').addEventListener('click',e=>{const a=document.documentElement.lang!=='ar';document.documentElement.lang=a?'ar':'en';document.documentElement.dir=a?'rtl':'ltr';
  $$('[data-ar]').forEach(x=>{if(x.dataset.ar)x.innerHTML=x.dataset[a?'ar':'en']});nameEl.placeholder=a?nameEl.dataset.arPh:nameEl.dataset.en;
  e.target.textContent=a?'English':'العربية';e.target.lang=a?'en':'ar';setHead();render()});
const menu=$('.menu');menu.addEventListener('click',()=>{const o=$('nav').classList.toggle('open');menu.setAttribute('aria-expanded',String(o))});
/* arriving from the home page wizard (?cat=&country=): apply its choices to the filters and show step 2 */
const qs=new URLSearchParams(location.search),okv=(el,v)=>v&&[...el.options].some(o=>o.value===v);
if(okv(fca,qs.get('cat'))){fca.value=qs.get('cat');$('#pp-cat').value=qs.get('cat')}
if(okv(fco,qs.get('country'))){fco.value=qs.get('country');$('#pp-country').value=qs.get('country')}
render();go(2,false);
if(qs.has('cat')||qs.has('country'))addEventListener('load',()=>setTimeout(()=>$('#wizard').scrollIntoView({behavior:'smooth',block:'start'}),150));

/* whole finished step pill is clickable */
sts.forEach(x=>x.addEventListener('click',e=>{if(e.target.closest('button')||!x.classList.contains('done'))return;$('button',x).click()}));
