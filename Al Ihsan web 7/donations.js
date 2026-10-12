document.documentElement.classList.add('js');
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
/* fade on scroll */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.1,rootMargin:'0px 0px -40px 0px'});
$$('.fade').forEach(e=>io.observe(e));
/* banner rotator */
const fg=$$('.pj-banner img'),dots=$$('.pj-dots i');let n=0,timer;
const show=i=>{n=(i+fg.length)%fg.length;fg.forEach((x,k)=>x.classList.toggle('on',k===n));dots.forEach((x,k)=>x.classList.toggle('on',k===n));clearTimeout(timer);timer=setTimeout(()=>show(n+1),4500)};
if(fg.length){dots.forEach((d,i)=>d.addEventListener('click',()=>show(i)));$('.pj-prev').addEventListener('click',()=>show(n-1));$('.pj-next').addEventListener('click',()=>show(n+1));show(0)}
/* method tabs */
const rtl=()=>document.documentElement.dir==='rtl';
const direct=$('.dn-panel[data-panel=direct]'),other=$('.dn-other'),infos=$$('.dn-info'),crumb=$('.dn-bc b');
$$('.pj-tab').forEach(t=>t.addEventListener('click',()=>{
  $$('.pj-tab').forEach(x=>{x.classList.toggle('selected',x===t);x.setAttribute('aria-selected',String(x===t))});
  const k=t.dataset.tab,isD=k==='direct';direct.hidden=!isD;other.hidden=isD;
  infos.forEach(i=>i.hidden=i.dataset.panel!==k);
  const lab=t.querySelector('[data-ar]');crumb.dataset.en=lab.dataset.en;crumb.dataset.ar=lab.dataset.ar;crumb.textContent=rtl()?lab.dataset.ar:lab.dataset.en;
  const p=isD?direct:other;p.style.animation='none';void p.offsetWidth;p.style.animation='dnin .5s ease both';
}));
/* donation wizard */
const form=$('#dn-form'),err=$('#dn-err'),ok=$('#dn-ok');
const panes=$$('.dw-pane'),prog=$$('.dw-prog li'),back=$('#dw-back'),next=$('#dw-next'),nextT=$('#dw-next-t');
const amt=$('#dn-amount'),chips=$$('.dw-chip'),segs=$$('.dw-seg button');
const isAr=()=>document.documentElement.lang==='ar';
const T={en:{req:'Please enter your full name and mobile number.',proj:'Please select a project to donate for.',amt:'Please enter an amount of at least 1 AED.',terms:'Please accept the Terms & Conditions.',aed:'AED',cont:'Continue',donate:'Donate now',ok:'Thank you! Your donation of {a} AED to “{p}” is ready — you will be taken to secure payment.',guest:'Guest'},ar:{req:'يرجى إدخال الاسم الكامل ورقم الهاتف.',proj:'يرجى اختيار المشروع الذي تريد التبرع له.',amt:'يرجى إدخال مبلغ لا يقل عن 1 درهم.',terms:'يرجى الموافقة على الشروط والأحكام.',aed:'درهم',cont:'متابعة',donate:'تبرع الآن',ok:'شكرًا لك! تبرعك بمبلغ {a} درهم لمشروع «{p}» جاهز — سيتم تحويلك إلى الدفع الآمن.',guest:'ضيف'}};
const L=()=>T[isAr()?'ar':'en'];
let step=1;
const projName=()=>{const r=$('.dw-proj input:checked');return r?r.closest('.dw-proj').querySelector('.dw-pname').textContent:''};
const val=()=>Math.max(0,Math.min(50000,Math.round(+String(amt.value).replace(/[^\d]/g,''))||0));
const fmt=v=>Number(v).toLocaleString('en-US');
const range=$('#dn-range');
const syncRange=v=>{if(!range)return;range.value=v;range.style.setProperty('--p',((Math.min(50000,Math.max(10,v))-10)/(50000-10)*100)+'%')};
const setAmt=v=>{v=Math.max(1,Math.min(50000,Math.round(+v)||1));amt.value=fmt(v);chips.forEach(c=>c.classList.toggle('on',+c.dataset.v===v));syncRange(v);label()};
if(range)range.addEventListener('input',()=>setAmt(range.value));
chips.forEach(c=>c.addEventListener('click',()=>setAmt(c.dataset.v)));
amt.addEventListener('input',()=>{const raw=amt.value.replace(/[^\d]/g,'').slice(0,5);amt.value=raw?fmt(Math.min(50000,+raw)):'';const v=val();chips.forEach(c=>c.classList.toggle('on',+c.dataset.v===v));syncRange(v);label()});
amt.addEventListener('blur',()=>{if(!val())setAmt(1)});
segs.forEach(b=>b.addEventListener('click',()=>segs.forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-checked',String(x===b))})));
{const qa=+new URLSearchParams(location.search).get('amount');if(qa>0)setAmt(qa)}
const fill=()=>{const f=form.elements,v=val().toLocaleString('en-US'),fr=$('.dw-seg .on');
  $('#rv-proj').textContent=projName()||'—';$('#rv-amt').textContent=v+' '+L().aed;
  const nm=f.fullname.value.trim();$('#rv-name').textContent=mode==='login'?O().user:(nm||L().guest);$('#rv-mob').textContent=(mode==='login'?lmob():f.mobile.value.trim())||'—'};
function ticket(){const r=$('.dw-proj input:checked'),fr=$('.dw-seg .on');
  $('#tk-name').textContent=projName()||'—';if(r){const src=r.closest('.dw-proj').querySelector('img').getAttribute('src');$('#tk-img').src=src;const oi=$('#dw-oimg');if(oi){oi.src=src;oi.alt=projName()}const on=$('#dw-oname');if(on)on.textContent=projName()}
  $('#tk-freq').textContent=fr?fr.textContent:'';$('#tk-amt').textContent=val().toLocaleString('en-US');
  const mp=$('#mini-proj'),ma=$('#mini-amt');if(mp){mp.textContent=projName()||'—';ma.textContent=val().toLocaleString('en-US')}}
function label(){ticket();nextT.textContent=step===2?L().donate+' · '+val().toLocaleString('en-US')+' '+L().aed:L().cont}
const check=n=>{const f=form.elements;
  if(n===1&&!$('.dw-proj input:checked'))return L().proj;
  if(n===1&&val()<1)return L().amt;
  if(n===2&&mode==='login'){$$('.dw-f',form).forEach(x=>x.classList.remove('bad'));if(!/^05\d{8}$/.test(lmob())){form.elements.lmobile.closest('.dw-f').classList.add('bad');return O().bad}if(!otpSent||form.elements.otp.value.length<4){if(otpSent)otpF.classList.add('bad');return O().code}return $('#dn-terms').checked?'':L().terms}
  if(n===2){$$('.dw-f',form).forEach(x=>x.classList.remove('bad'));const bad=['fullname','mobile'].filter(k=>!f[k].value.trim());bad.forEach(k=>f[k].closest('.dw-f').classList.add('bad'));if(bad.length)return L().req}
  if(n===2&&!$('#dn-terms').checked)return L().terms;return''};
const go=n=>{step=n;panes.forEach(p=>p.classList.toggle('on',+p.dataset.step===n));
  prog.forEach(li=>{const s=+li.dataset.s;li.classList.toggle('cur',s===n);li.classList.toggle('done',s<n)});
  back.hidden=n===1;label();err.hidden=true;ok.hidden=true;
  const c=$('.dw-card');const r=c.getBoundingClientRect();if(r.top<0)c.scrollIntoView({behavior:'smooth',block:'start'})};
const submit=()=>{ok.textContent=L().ok.replace('{a}',val().toLocaleString('en-US')).replace('{p}',projName());ok.hidden=false;ok.scrollIntoView({behavior:'smooth',block:'center'});
  setTimeout(()=>window.open('https://alihsan.ae/ar/donation/direct-donation','_blank','noopener'),1800)};
next.addEventListener('click',()=>{const m=check(step);err.hidden=!m;err.textContent=m;if(m)return;step<2?go(step+1):submit()});
back.addEventListener('click',()=>go(step-1));
/* details: guest / login tabs — login uses mobile number + OTP inside the step */
let mode='guest',otpSent=false;
const modeBtns=$$('.dw-mode button'),gPane=$('#dw-guest-pane'),lPane=$('#dw-login-pane'),otpF=$('.dw-otpf'),otpNote=$('#dw-otpnote');
const OT={en:{get:'Get OTP',resend:'Resend OTP',bad:'Please enter a valid UAE mobile number (05X XXX XXXX).',sent:'Design preview · no SMS was sent to {m}. Enter any 4–6 digit code.',code:'Please get an OTP and enter the code.',user:'Signed in with mobile'},ar:{get:'الحصول على رمز التحقق',resend:'إعادة إرسال الرمز',bad:'يرجى إدخال رقم هاتف إماراتي صحيح (05X XXX XXXX).',sent:'نموذج تصميم · لم تُرسل رسالة إلى {m}. أدخل أي رمز من 4 إلى 6 أرقام.',code:'يرجى طلب رمز التحقق وإدخاله.',user:'دخول برقم الهاتف'}};
const O=()=>OT[isAr()?'ar':'en'];
const lmob=()=>form.elements.lmobile.value.replace(/[\s-]/g,'');
const setMode=m=>{mode=m;modeBtns.forEach(b=>{const on=b.dataset.mode===m;b.classList.toggle('on',on);b.setAttribute('aria-selected',String(on))});gPane.hidden=m!=='guest';lPane.hidden=m!=='login';err.hidden=true;$$('.dw-f',form).forEach(x=>x.classList.remove('bad'))};
modeBtns.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
$('#dw-otp').addEventListener('click',()=>{const f=form.elements.lmobile.closest('.dw-f');f.classList.remove('bad');
  if(!/^05\d{8}$/.test(lmob())){f.classList.add('bad');err.textContent=O().bad;err.hidden=false;form.elements.lmobile.focus();return}
  err.hidden=true;otpSent=true;otpF.hidden=false;otpNote.textContent=O().sent.replace('{m}',lmob());otpNote.hidden=false;$('#dw-otp-t').textContent=O().resend;form.elements.otp.value='';form.elements.otp.focus()});
form.elements.otp.addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,6)});
form.addEventListener('submit',e=>{e.preventDefault();next.click()});
$$('.dw-proj input').forEach(i=>i.addEventListener('change',()=>{err.hidden=true;ticket()}));
segs.forEach(b=>b.addEventListener('click',ticket));
const wizRefresh=()=>{label();err.hidden=true;ok.hidden=true};
syncRange(val());
new MutationObserver(wizRefresh).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
label();
/* feedback */
$$('.dn-face').forEach(b=>b.addEventListener('click',()=>$$('.dn-face').forEach(x=>x.classList.toggle('on',x===b))));
/* language + mobile menu */
$$('[data-ar]').forEach(e=>e.dataset.en=e.innerHTML);
$('#language').addEventListener('click',e=>{const ar=document.documentElement.lang!=='ar';document.documentElement.lang=ar?'ar':'en';document.documentElement.dir=ar?'rtl':'ltr';$$('[data-ar]').forEach(x=>x.innerHTML=x.dataset[ar?'ar':'en']);e.target.textContent=ar?'English':'العربية';e.target.lang=ar?'en':'ar';});
const menu=$('.menu');menu.addEventListener('click',()=>{const o=$('nav').classList.toggle('open');menu.setAttribute('aria-expanded',String(o))});

/* method pill strip arrows */
(()=>{const tabs=$('.dn-tabswrap .pj-tabs'),pv=$('.dn-tabswrap .prev'),nx=$('.dn-tabswrap .next');if(!tabs)return;
const rt=()=>document.documentElement.dir==='rtl';
const upd=()=>{const max=tabs.scrollWidth-tabs.clientWidth,x=Math.abs(tabs.scrollLeft),a=x<4,b=x>max-4;pv.disabled=rt()?b:a;nx.disabled=rt()?a:b};
pv.addEventListener('click',()=>tabs.scrollBy({left:rt()?250:-250}));nx.addEventListener('click',()=>tabs.scrollBy({left:rt()?-250:250}));
tabs.addEventListener('scroll',upd);addEventListener('resize',upd);setTimeout(upd,80);upd();
$$('.dn-pill').forEach(t=>t.addEventListener('click',()=>t.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'})));})();
/* gift builder */
(()=>{const root=$('.gf-wrap');if(!root)return;
const card=$('#gf-card',root),L=()=>document.documentElement.lang==='ar';
const go=k=>{$$('.gf-tab',root).forEach(t=>{t.classList.toggle('on',t.dataset.t===k);if(t.dataset.t===k&&t.parentElement.scrollWidth>t.parentElement.clientWidth)t.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'})});$$('.gf-pane',root).forEach(p=>p.classList.toggle('on',p.dataset.p===k))};
$$('.gf-tab',root).forEach(t=>t.addEventListener('click',()=>go(t.dataset.t)));
const order=['occ','prj','col','snd','rcv'];
$$('.gf-next',root).forEach(b=>b.addEventListener('click',()=>{const cur=$('.gf-pane.on',root).dataset.p;go(order[order.indexOf(cur)+1])}));
const pick=(sel,fn)=>$$(sel,root).forEach(o=>o.addEventListener('click',()=>{$$(sel,root).forEach(x=>x.classList.toggle('on',x===o));fn(o)}));
pick('.gf-opt:not(.gf-p)',o=>{$('#gf-p-em').textContent=o.dataset.emoji});
const prj=o=>{$('#gf-p-prj').textContent=L()?o.dataset.ar:o.dataset.v;$('#gf-p-prj').dataset.v=o.dataset.v;$('#gf-p-prj').dataset.ar=o.dataset.ar};
pick('.gf-p',prj);prj($('.gf-p.on',root));
const sv=$('#cp-sv'),hue=$('#cp-hue'),dot=$('#cp-dot'),hd=$('#cp-hd'),nw=$('#cp-new'),cur=$('#cp-cur'),hex=$('#cp-hex'),fl={};$$('.cp-fields [data-k]').forEach(i=>fl[i.dataset.k]=i);
let H=160,S=100,V=44;
const h2r=(h,s,v)=>{s/=100;v/=100;const f=n=>{const k=(n+h/60)%6;return v-v*s*Math.max(0,Math.min(k,4-k,1))};return[f(5),f(3),f(1)].map(x=>Math.round(x*255))};
const r2h=(r,g,b)=>{r/=255;g/=255;b/=255;const m=Math.max(r,g,b),d=m-Math.min(r,g,b);let h=0;if(d){h=m===r?((g-b)/d)%6:m===g?(b-r)/d+2:(r-g)/d+4;h=Math.round(h*60);if(h<0)h+=360}return[h,m?Math.round(d/m*100):0,Math.round(m*100)]};
const hx=(r,g,b)=>[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
const paint=(skip)=>{const[r,g,b]=h2r(H,S,V),c='#'+hx(r,g,b);sv.style.setProperty('--h',H);dot.style.left=S+'%';dot.style.top=(100-V)+'%';hd.style.top=(H/360*100)+'%';nw.style.background=c;card.style.setProperty('--gc',c);
 const vals={h:H,s:S,v:V,r,g,b};for(const k in fl)if(k!==skip)fl[k].value=vals[k];if(skip!=='hex')hex.value=hx(r,g,b);$$('.gf-sw').forEach(x=>x.classList.toggle('on',x.dataset.c.toLowerCase()===c))};
const drag=(el,fn)=>{const mv=e=>{const r=el.getBoundingClientRect();fn(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)));};el.addEventListener('pointerdown',e=>{el.setPointerCapture(e.pointerId);mv(e);const up=()=>{el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',up)};el.addEventListener('pointermove',mv);el.addEventListener('pointerup',up)})};
drag(sv,(x,y)=>{S=Math.round(x*100);V=Math.round((1-y)*100);paint()});
drag(hue,(x,y)=>{H=Math.round(y*360)%360;paint()});
sv.addEventListener('keydown',e=>{const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[e.key];if(d){S=Math.max(0,Math.min(100,S+d[0]*2));V=Math.max(0,Math.min(100,V+d[1]*2));paint();e.preventDefault()}});
hue.addEventListener('keydown',e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){H=(H+(e.key==='ArrowUp'?-6:6)+360)%360;paint();e.preventDefault()}});
const setRGB=(r,g,b)=>{[H,S,V]=r2h(r,g,b)};
$$('.cp-fields [data-k]').forEach(i=>i.addEventListener('input',()=>{const k=i.dataset.k,v=Math.max(0,+i.value||0);if('hsv'.includes(k)){if(k==='h')H=Math.min(360,v)%360;if(k==='s')S=Math.min(100,v);if(k==='v')V=Math.min(100,v)}else{const rgb=['r','g','b'].map(q=>Math.min(255,q===k?v:+fl[q].value||0));setRGB(...rgb)}paint(k)}));
hex.addEventListener('input',()=>{let v=hex.value.replace(/[^0-9a-f]/gi,'');if(v.length===3)v=v.split('').map(c=>c+c).join('');if(v.length===6){setRGB(parseInt(v.slice(0,2),16),parseInt(v.slice(2,4),16),parseInt(v.slice(4),16));paint('hex')}});
$$('.gf-sw').forEach(o=>o.addEventListener('click',()=>{const v=o.dataset.c.slice(1);setRGB(parseInt(v.slice(0,2),16),parseInt(v.slice(2,4),16),parseInt(v.slice(4),16));paint()}));
cur.style.background='#00705a';setRGB(0,112,90);paint();
const mob=$('#gf-mob'),from=$('#gf-from'),show=$('#gf-show'),msg=$('#gf-err');
const syncFrom=()=>{const n=show.checked?from.value.trim():'';$('#gf-p-from').textContent=n;$('#gf-p-by').hidden=!n};
from.addEventListener('input',syncFrom);show.addEventListener('change',syncFrom);
mob.addEventListener('input',()=>{mob.value=mob.value.replace(/\D/g,'').slice(0,10);mob.classList.remove('bad')});
const say=(t,ok)=>{msg.textContent=t;msg.classList.toggle('ok',!!ok);msg.hidden=false};
$('#gf-go').addEventListener('click',()=>{mob.classList.remove('bad');/* testing: no mobile-number format check */
if(show.checked&&!from.value.trim()){say(L()?'يرجى إدخال اسم المُهدي لإظهاره للمُهدى إليه.':'Please enter your name to show it to the recipient.');from.focus();return}
say(L()?'معاينة فقط · لم يتم إرسال رمز التحقق إلى '+mob.value:'Preview only · no OTP was sent to '+mob.value.replace(/^(\d{3})(\d{3})(\d{4})$/,'$1 $2 $3'),true);const rt=$('.gf-tab[data-t=rcv]',root);rt.disabled=false;rt.removeAttribute('title');go('rcv');$('#gf-err').hidden=true;$('#gf-rmob').focus({preventScroll:true})});
/* receiver step: recipient details, gift amount, optional amount on the card */
{const rmob=$('#gf-rmob'),rto=$('#gf-to'),ramt=$('#gf-ramt'),rchips=$$('.gf-rchip',root),showA=$('#gf-showamt'),rerr=$('#gf-rerr'),pAmt=$('#gf-p-amt');
 const fmt=v=>Number(v).toLocaleString('en-US'),rv=()=>+String(ramt.value).replace(/\D/g,'')||0;
 const rr=$('#gf-rrange');
 const syncAmt=(fromRange)=>{const v=rv();rchips.forEach(c=>c.classList.toggle('on',+c.dataset.v===v));if(rr){if(fromRange!==true)rr.value=Math.max(10,v);rr.style.setProperty('--p',((Math.min(50000,Math.max(10,v))-10)/(50000-10)*100)+'%')}pAmt.textContent=v?fmt(v)+(L()?' درهم':' AED'):'';pAmt.hidden=!(showA.checked&&v)};
 rchips.forEach(c=>c.addEventListener('click',()=>{ramt.value=fmt(c.dataset.v);syncAmt()}));
 ramt.addEventListener('input',()=>{const raw=ramt.value.replace(/\D/g,'').slice(0,5);ramt.value=raw?fmt(Math.min(50000,+raw)):'';syncAmt()});
 showA.addEventListener('change',syncAmt);
 if(rr)rr.addEventListener('input',()=>{ramt.value=fmt(rr.value);syncAmt(true)});
 rto.addEventListener('input',()=>{$('#gf-p-to').textContent=rto.value;rto.classList.remove('bad')});
 rmob.addEventListener('input',()=>{rmob.value=rmob.value.replace(/\D/g,'').slice(0,10);rmob.classList.remove('bad')});
 const rsay=(t,ok)=>{rerr.textContent=t;rerr.classList.toggle('ok',!!ok);rerr.hidden=false};
 $('#gf-send').addEventListener('click',()=>{
  if(!/^05\d{8}$/.test(rmob.value)){rmob.classList.add('bad');rmob.focus();return rsay(L()?'يرجى إدخال رقم هاتف المُهدى إليه بشكل صحيح (يبدأ بـ 05، 10 أرقام).':'Please enter the recipient’s mobile number (10 digits starting with 05).')}
  if(!rto.value.trim()){rto.classList.add('bad');rto.focus();return rsay(L()?'يرجى إدخال اسم المُهدى إليه.':'Please enter the recipient’s name.')}
  if(rv()<10){ramt.focus();return rsay(L()?'يرجى إدخال مبلغ لا يقل عن 10 دراهم.':'Please enter an amount of at least 10 AED.')}
  rsay((L()?'معاينة فقط · هديتك بقيمة ':'Preview only · your gift of ')+fmt(rv())+(L()?' درهم إلى ':' AED to ')+rto.value.trim()+(L()?' جاهزة — لم يتم إرسال أي رسالة.':' is ready — no message was sent.'),true)});
 new MutationObserver(syncAmt).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 syncAmt()}
new MutationObserver(()=>{const p=$('#gf-p-prj');p.textContent=L()?p.dataset.ar:p.dataset.v;$$('.gf-form input[data-ar-ph]',root).forEach(i=>{i.dataset.en=i.dataset.en||i.placeholder;i.placeholder=L()?i.dataset.arPh:i.dataset.en})}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();

/* SMS table mobile labels follow the language */
(()=>{const f=()=>document.querySelectorAll('.sms-table td[data-l]').forEach(td=>{td.style.setProperty('--x','')});
new MutationObserver(()=>document.querySelectorAll('.sms-table td[data-l]').forEach(td=>{td.dataset.l=document.documentElement.lang==='ar'?td.dataset.lar:(td.dataset.len||td.dataset.l);}) ).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
document.querySelectorAll('.sms-table td[data-l]').forEach(td=>td.dataset.len=td.dataset.l);})();
/* bank: copy IBAN */
document.querySelectorAll('.bk-copy').forEach(b=>b.addEventListener('click',async()=>{const v=b.dataset.copy;try{await navigator.clipboard.writeText(v)}catch{const t=document.createElement('textarea');t.value=v;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}
 const sp=b.querySelector('span'),o=sp.textContent,ar=document.documentElement.lang==='ar';sp.textContent=ar?'تم النسخ ✓':'Copied ✓';b.classList.add('done');setTimeout(()=>{sp.textContent=ar?sp.dataset.ar:(sp.dataset.en||o);b.classList.remove('done')},1600)}));
/* site representative filter + map toggle */
(()=>{const q=$('#st-q');if(!q)return;const sel=$('#st-em'),cards=$$('.st-card'),empty=$('#st-empty'),tg=$('#st-tg'),mb=$('#st-mapbox'),fr=$('iframe',mb);
const r=()=>{const t=q.value.trim().toLowerCase(),e=sel.value;let n=0;cards.forEach(c=>{const ok=(e==='all'||c.dataset.em===e)&&(!t||c.dataset.t.includes(t)||c.textContent.toLowerCase().includes(t));c.hidden=!ok;if(ok)n++});empty.hidden=n>0;
 fr.src='https://maps.google.com/maps?q='+encodeURIComponent(e==='all'?'Ajman, Ras Al Khaimah':e)+'&output=embed'};
q.addEventListener('input',r);sel.addEventListener('change',r);tg.addEventListener('change',()=>{mb.hidden=!tg.checked});
new MutationObserver(()=>{q.placeholder=document.documentElement.lang==='ar'?q.dataset.arPh:'Type a keyword'}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});})();
/* delegate form */
(()=>{const form=$('#dg-form');if(!form)return;const err=$('#dg-err'),ok=$('#dg-ok'),ar=()=>document.documentElement.lang==='ar';
const d=form.elements.date;d.min=new Date().toISOString().slice(0,10);
form.addEventListener('submit',e=>{e.preventDefault();ok.hidden=true;const f=form.elements;$$('.dg-f',form).forEach(x=>x.classList.remove('bad'));
 const req=['first','mobile','location','date','time'],bad=req.filter(k=>!String(f[k].value).trim());bad.forEach(k=>f[k].closest('.dg-f').classList.add('bad'));
 let m='';if(bad.length)m=ar()?'يرجى تعبئة الحقول المطلوبة.':'Please fill in the required fields.';
 else if(!/^[+\d][\d\s-]{6,}$/.test(f.mobile.value.trim())){f.mobile.closest('.dg-f').classList.add('bad');m=ar()?'رقم الهاتف غير صحيح.':'Please enter a valid mobile number.'}
 else if(f.email.value&&!f.email.checkValidity()){f.email.closest('.dg-f').classList.add('bad');m=ar()?'البريد الإلكتروني غير صحيح.':'Please enter a valid email.'}
 else if(!f.terms.checked)m=ar()?'يرجى الموافقة على الشروط والأحكام.':'Please accept the Terms & Conditions.';
 err.hidden=!m;err.textContent=m;if(m){err.scrollIntoView({behavior:'smooth',block:'center'});return}
 ok.textContent=ar()?'شكراً لك! تم استلام طلبك وسنتواصل معك لتأكيد الموعد.':'Thank you! Your request was received and we will contact you to confirm the slot.';ok.hidden=false;form.reset();ok.scrollIntoView({behavior:'smooth',block:'center'})});
})();
/* subscriptions form */
(()=>{const f=$('#sb-form');if(!f)return;
const range=$('#sb-range',f),amt=$('#sb-amount',f),chips=$$('.sb-chip',f),msg=$('#sb-msg',f),ar=()=>document.documentElement.lang==='ar';
let type=$('.sb-type.on',f),cause=null;const causesBox=$('#sb-causes');
const render=()=>{const fr=$('.sb-freq.on',f),v=+amt.value||10,a=ar();
  $('#sb-s-amt').textContent=v.toLocaleString('en-US');
  $('#sb-s-every').textContent=a?fr.dataset.evar:fr.dataset.ev;
  $('#sb-s-freq').textContent=a?fr.dataset.ar:fr.dataset.v;
  $('#sb-s-year').textContent=(v*fr.dataset.n).toLocaleString('en-US')+(a?' درهم':' AED');
  $('#sb-for').textContent=cause?(a?cause.dataset.nar:cause.dataset.n):(a?type.dataset.tar:type.dataset.t)};
const set=(v,from)=>{v=Math.max(10,Math.min(50000,Math.round(+v)||10));if(from!=='range')range.value=v;if(from!=='amt')amt.value=v;chips.forEach(c=>c.classList.toggle('on',+c.dataset.v===v));render()};
range.addEventListener('input',()=>set(range.value,'range'));amt.addEventListener('input',()=>{if(amt.value!=='')set(amt.value,'amt')});amt.addEventListener('blur',()=>set(amt.value||10));
chips.forEach(c=>c.addEventListener('click',()=>set(c.dataset.v)));
$('#sb-minus').addEventListener('click',()=>set((+amt.value||10)-10));$('#sb-plus').addEventListener('click',()=>set((+amt.value||10)+10));
$$('.sb-type',f).forEach(t=>t.addEventListener('click',()=>{type=t;if(t.dataset.t!=='Case'){cause=null;$$('.sb-cause',f).forEach(x=>x.classList.remove('on'))}causesBox.hidden=t.dataset.t!=='Case';f.classList.toggle('is-case',t.dataset.t==='Case');$$('.sb-type',f).forEach(x=>{x.classList.toggle('on',x===t);x.setAttribute('aria-pressed',String(x===t))});render()}));
$$('.sb-csub',f).forEach(b=>b.addEventListener('click',()=>{const c=b.closest('.sb-cause');cause=c;$$('.sb-cause',f).forEach(x=>x.classList.toggle('on',x===c));window.open('https://alihsan.ae/ar/donation/direct-donation','_blank','noopener')}));
$$('.sb-freq',f).forEach(b=>b.addEventListener('click',()=>{$$('.sb-freq',f).forEach(x=>x.classList.toggle('on',x===b));render()}));
$$('[data-ar-ph]',f).forEach(i=>i.dataset.enPh=i.placeholder);
$('#language').addEventListener('click',()=>{$$('[data-ar-ph]',f).forEach(i=>i.placeholder=ar()?i.dataset.arPh:i.dataset.enPh);msg.hidden=true;render()});
const fail=t=>{msg.className='sb-msg';msg.textContent=t;msg.hidden=false};
f.addEventListener('submit',e=>{e.preventDefault();const a=ar(),nm=$('#sb-name'),mb=$('#sb-mobile');
  if(type.dataset.t==='Case'&&!cause){fail(a?'يرجى اختيار الحالة التي تريد التبرع لها.':'Please select the specific cause you want to donate for.');causesBox.scrollIntoView({behavior:'smooth',block:'center'});return}
  [nm,mb].forEach(i=>i.classList.toggle('bad',!i.value.trim()));
  if(!nm.value.trim()||!mb.value.trim()){fail(a?'يرجى إدخال الاسم ورقم الجوال.':'Please fill in your name and mobile number.');nm.value.trim()?mb.focus():nm.focus();return}
  if(!$('#sb-terms').checked){fail(a?'يرجى قبول الشروط والأحكام.':'Please accept the Terms & Conditions.');return}
  const fr=$('.sb-freq.on',f);msg.className='sb-msg ok';
  msg.textContent=a?`شكراً لك! اشتراكك ${fr.dataset.ar} بمبلغ ${amt.value} درهم جاهز — سيتم تحويلك إلى الدفع الآمن.`:`Thank you! Your ${fr.dataset.v.toLowerCase()} subscription of ${amt.value} AED is ready — you will be taken to secure payment.`;msg.hidden=false;
  setTimeout(()=>window.open('https://alihsan.ae/ar/donation/direct-donation','_blank','noopener'),1800)});
render();})();

/* open the tab named in the link, e.g. Direct%20Donation.html?tab=bank */
(()=>{const k=new URLSearchParams(location.search).get('tab');if(!k)return;const t=document.querySelector('.pj-tab[data-tab="'+k+'"]');if(!t)return;
  setTimeout(()=>{t.click();const h=document.getElementById('donate');if(h)h.scrollIntoView({behavior:'smooth',block:'start'})},350)})();
