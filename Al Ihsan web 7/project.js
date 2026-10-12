const CATS={"endowment": {"en": "Endowment Projects", "ar": "مشاريع الأوقاف"}, "general": {"en": "General Project", "ar": "مشروع عام"}, "seasonal": {"en": "Seasonal Projects", "ar": "المشاريع الموسمية"}, "campaigns": {"en": "Campaigns", "ar": "الحملات"}, "initiatives": {"en": "Initiatives", "ar": "المبادرات"}, "hospital": {"en": "Al Safia Hospital", "ar": "مستشفى الصفية"}, "sponsor": {"en": "Sponsorship", "ar": "الكفالة"}};
const PROJECTS=[
{
"id": "endowment-housing",
"cat": "endowment",
"raised": 991,
"goal": 90000,
"img": "assets/endowment.jpg",
"t": [
"Charitable Endowment — Housing for Poor Families",
"وقف خيري — سكن للأسر المحتاجة"
],
"d": [
"Build a lasting endowment whose returns support families for a lifetime. Every contribution becomes an ongoing charity.",
"ساهم في وقف تعود منفعته على الأسر مدى الحياة، وكل مساهمة صدقة جارية."
]
},
{
"id": "endowment-quran",
"cat": "endowment",
"img": "assets/endowment-1710835381.jpg",
"t": [
"Endowment of the Quran Memorisation Centres",
"وقف مراكز تحفيظ القرآن"
],
"d": [
"Support the running costs of Quran centres through a sustainable endowment. Minimum target: 150,000 AED.",
"ادعم تشغيل مراكز تحفيظ القرآن عبر وقف مستدام. المبلغ المطلوب: 150,000 درهم."
]
},
{
"id": "water-wells",
"cat": "general",
"img": "assets/water.jpg",
"t": [
"Clean Water Wells",
"سقيا الماء"
],
"d": [
"Provide safe drinking water to communities in need by digging wells and installing pumps.",
"وفّر مياه الشرب النظيفة للمجتمعات المحتاجة عبر حفر الآبار وتركيب المضخات."
]
},
{
"id": "food-parcels",
"cat": "general",
"img": "assets/food.jpg",
"t": [
"Food Parcels for Families",
"طرود غذائية للأسر"
],
"d": [
"A food parcel feeds a family for a month. Give dignity and relief to those who need it most.",
"طرد غذائي يكفي أسرة لشهر كامل، قدّم الكرامة والعون لمن هم في أمسّ الحاجة."
]
},
{
"id": "ramadan-iftar",
"cat": "seasonal",
"img": "assets/giving.jpg",
"t": [
"Ramadan Iftar Meals",
"وجبات إفطار رمضان"
],
"d": [
"Share the blessing of Ramadan by sponsoring iftar meals for fasting families and workers.",
"شارك بركة رمضان بكفالة وجبات إفطار للصائمين من الأسر والعمال."
]
},
{
"id": "gaza-relief",
"cat": "campaigns",
"img": "assets/gaza.jpg",
"t": [
"Emergency Relief — Gaza",
"الإغاثة العاجلة — غزة"
],
"d": [
"Urgent shelter, food and medical aid for families affected by the crisis.",
"مأوى وغذاء ومساعدات طبية عاجلة للأسر المتضررة من الأزمة."
]
},
{
"id": "volunteer-together",
"cat": "initiatives",
"img": "assets/volunteers.jpg",
"t": [
"Volunteer Together Initiative",
"مبادرة تطوعنا معاً"
],
"d": [
"Join our volunteers and help deliver aid directly to beneficiaries across the UAE.",
"انضم إلى متطوعينا وساعد في إيصال المساعدات مباشرة إلى المستفيدين في الدولة."
]
},
{
"id": "medical-dialysis",
"cat": "hospital",
"img": "assets/hospital.jpg",
"t": [
"Medical Case — Dialysis Treatment",
"حالة طبية — غسيل الكلى"
],
"d": [
"Help cover the cost of kidney dialysis sessions so a father can return to his family. Required amount: 35,000 AED.",
"ساهم في تكاليف جلسات غسيل الكلى ليعود أب إلى أسرته. المبلغ المطلوب: 35,000 درهم."
]
},
{
"id": "medical-radiotherapy",
"cat": "hospital",
"img": "assets/care.jpg",
"t": [
"Medical Case — Cancer Radiotherapy",
"حالة طبية — العلاج الإشعاعي"
],
"d": [
"Your support helps a mother facing cancer afford radiotherapy treatment. Required amount: 90,000 AED.",
"دعمكم يساعد أمًا تواجه السرطان على تحمّل تكاليف العلاج الإشعاعي. المبلغ المطلوب: 90,000 درهم."
]
},
{
"id": "orphan-sponsorship",
"cat": "sponsor",
"img": "assets/community.jpg",
"t": [
"Orphan Sponsorship",
"كفالة يتيم"
],
"d": [
"Sponsor an orphan and secure education, healthcare and a caring future. From 100 AED per month.",
"اكفل يتيمًا وأمّن له التعليم والرعاية والمستقبل الكريم. ابتداءً من 100 درهم شهريًا."
]
}
];
document.documentElement.classList.add('js');
const $=s=>document.querySelector(s),ar=()=>document.documentElement.lang==='ar',L=a=>a[ar()?1:0];
const id=new URLSearchParams(location.search).get('id');
const idx=Math.max(0,PROJECTS.findIndex(p=>p.id===id));
const cur=PROJECTS[idx];
const url=p=>'project.html?id='+p.id;
const DONATE='https://alihsan.ae/ar/donation/direct-donation';
/* related: same category first, then the rest, 3 total */
const related=PROJECTS.filter(p=>p!==cur).sort((a,b)=>(b.cat===cur.cat)-(a.cat===cur.cat)).slice(0,3);
const smsSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9 12h.01M12 12h.01M15 12h.01"/></svg>';
const heartSvg='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#fff"/><path d="M12 18s-5.5-3.3-5.5-7a3 3 0 0 1 5.5-1.6A3 3 0 0 1 17.5 11c0 3.7-5.5 7-5.5 7z" fill="#00705a"/></svg>';
const render=()=>{
  document.title=L(cur.t)+' — Al Ihsan';
  $('#pd-cat').textContent=L(CATS[cur.cat]&&[CATS[cur.cat].en,CATS[cur.cat].ar]||['','']);
  $('#pd-title').textContent=L(cur.t);
  $('#pd-img').src=cur.img;$('#pd-img').alt=cur.t[0];
  $('#pd-desc').textContent=L(cur.d);
  /* funding progress (only when the project has a goal) */
  const prog=$('#pd-prog');
  if(cur.goal){const pct=Math.min(100,cur.raised/cur.goal*100),aed=ar()?' درهم':'AED';
    $('#pd-raised').textContent=cur.raised.toLocaleString('en-US')+aed;$('#pd-goal').textContent=cur.goal.toLocaleString('en-US')+aed;
    $('#pd-pct').textContent=pct.toFixed(2)+'%';$('#pd-bar').style.setProperty('--w',pct+'%');
    $('#pd-track').setAttribute('aria-valuenow',pct.toFixed(2));prog.hidden=false}
  else prog.hidden=true;
  const catName=p=>L([CATS[p.cat].en,CATS[p.cat].ar]);
  $('#pd-cards').innerHTML=related.map(p=>'<article class="pd-card"><a class="pd-card-img" href="'+url(p)+'" style="--bg:url('+p.img+')" aria-label="'+p.t[0]+'"><img src="'+p.img+'" alt="" loading="lazy"><span class="pd-tag">'+catName(p)+'</span><span class="pd-view">'+(ar()?'عرض التفاصيل':'View details')+'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></a><div class="pd-card-body"><h3><a href="'+url(p)+'">'+L(p.t)+'</a></h3><div class="pd-card-act"><a class="pd-ico" href="sms:" aria-label="'+(ar()?'تبرع بالرسائل':'SMS donation')+'" title="'+(ar()?'تبرع بالرسائل':'SMS donation')+'">'+smsSvg+'</a><a class="pd-don" href="'+DONATE+'" target="_blank" rel="noopener">'+heartSvg+'<span>'+(ar()?'تبرع الآن':'Donate now')+'</span></a></div></div></article>').join('');
};
/* amount: slider <-> chips <-> input */
const sum=$('#pd-sum'),range=$('#pd-range'),amt=$('#pd-amt'),chips=[...document.querySelectorAll('#pd-chips button')];
const sync=(v,from)=>{v=Math.max(0,Math.min(Number(v)||0,50000));
  if(from!=='amt')amt.value=v||'';
  if(from!=='range')range.value=Math.max(10,v);
  range.style.setProperty('--p',((Math.max(10,v)-10)/49990*100)+'%');
  chips.forEach(b=>b.classList.toggle('on',Number(b.dataset.v)===v));sum.textContent='AED '+(v||0).toLocaleString('en-US')};
range.addEventListener('input',()=>sync(range.value,'range'));
amt.addEventListener('input',()=>sync(amt.value,'amt'));
chips.forEach(b=>b.addEventListener('click',()=>sync(b.dataset.v)));
sync(1,'init');amt.value=1;
const stepBy=d=>{const v=Number(amt.value)||0,s=v>=1000?500:v>=100?50:v>=10?10:1;sync(Math.max(1,v+d*s))};
$('#pd-minus').addEventListener('click',()=>stepBy(-1));$('#pd-plus').addEventListener('click',()=>stepBy(1));
$('#pd-cart').addEventListener('click',()=>{if(!window.IhsanCart)return;IhsanCart.add({id:cur.id,en:cur.t[0],ar:cur.t[1],img:cur.img,amount:Number(amt.value)||10});location.href='cart.html'});
/* language */
document.querySelectorAll('[data-ar]').forEach(e=>e.dataset.en=e.innerHTML);
$('#language').addEventListener('click',e=>{const a=!ar();document.documentElement.lang=a?'ar':'en';document.documentElement.dir=a?'rtl':'ltr';document.querySelectorAll('[data-ar]').forEach(x=>x.innerHTML=x.dataset[a?'ar':'en']);e.target.textContent=a?'English':'العربية';e.target.lang=a?'en':'ar';render()});
const menu=document.querySelector('.menu');menu.addEventListener('click',()=>{const o=document.querySelector('nav').classList.toggle('open');menu.setAttribute('aria-expanded',String(o))});
render();
