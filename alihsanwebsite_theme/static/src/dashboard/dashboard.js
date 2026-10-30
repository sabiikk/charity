/* Al Ihsan — unified donation dashboard for Odoo.
   Demo mode (default, /alihsan/dashboard): the original concept with generated sample data, kept in this browser.
   Live mode (/alihsan/dashboard?live=1): data comes from Odoo (JSON in #db-data, refreshed from /alihsan/dashboard/data)
   and changes are saved through the /alihsan/dashboard/* routes with the user's own access rights. */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let LANG='en';
const tr=(en,ar)=>LANG==='ar'?ar:en;
const nf=n=>Math.round(n).toLocaleString('en-US');
const aed=n=>(CUR==='AED'?tr('AED ','د.إ '):CUR+' ')+nf(n);
const kfmt=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(n>=1e4?0:1)+'K':nf(n);
const dfmt=(d,o={day:'numeric',month:'short'})=>d.toLocaleDateString(LANG==='ar'?'ar-AE-u-nu-latn':'en-GB',o);
const store={get(k,d){try{const v=localStorage.getItem('db-'+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem('db-'+k,JSON.stringify(v))}catch(e){}}};

/* ---------- Odoo bridge ---------- */
const SRV=(()=>{try{return JSON.parse($('#db-data').textContent)}catch(e){return null}})();
const CUR=SRV?SRV.currency:'AED',IMG='/alihsanwebsite_theme/static/src/img/';
const rpc=(url,params)=>fetch(url,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',method:'call',params})})
  .then(r=>r.json()).then(r=>{if(r.error)throw new Error(r.error.data?.message||r.error.message);if(r.result&&r.result.ok===false)throw new Error(r.result.error);return r.result});
const fail=e=>toast(tr('Could not save','تعذر الحفظ'),{type:'err',sub:e&&e.message||String(e)});
const odoo=path=>window.open('/odoo/'+path,'_blank','noopener');
const readFile=f=>new Promise((ok,ko)=>{if(!f||!f.size)return ok(null);const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=ko;r.readAsDataURL(f)});
if(!SRV){const m=$('#db-mode');m.textContent='Concept · Sample data';m.dataset.ar='نموذج · بيانات تجريبية'}

/* ---------- icons ---------- */
const P={
 home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
 web:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
 mega:'<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M17 8a5 5 0 0 1 0 8M19.5 5.5a8.5 8.5 0 0 1 0 13"/>',
 kiosk:'<rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M10 18.5h4"/>',
 card:'<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>',
 users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.2c3 .2 5.5 2.2 5.5 5.3"/>',
 receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
 chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
 shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
 coins:'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v4c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 10v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4M5 14v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/>',
 swap:'<path d="M4 8h14l-4-4M20 16H6l4 4"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 pin:'<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
 layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
 money:'<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.01M18 15v.01"/>',
 up:'<path d="m6 14 6-6 6 6"/>',down:'<path d="m6 10 6 6 6-6"/>',
 eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',chev:'<path d="m9 6 6 6-6 6"/>',
 dots:'<circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>',
 wifi:'<path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"/><path d="M12 19h.01"/>',
 alert:'<path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
 file:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 13h6M9 17h4"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
 edit:'<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
 download:'<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
 check:'<path d="M5 12l5 5L20 7"/>',refresh:'<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>',
 send:'<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',upload:'<path d="M12 20V9M7 14l5-5 5 5M4 4h16"/>',
 trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',pause:'<path d="M9 5v14M15 5v14"/>',play:'<path d="m7 4 13 8-13 8z"/>',
 heart:'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
 print:'<path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/>',
 grip:'<circle cx="9" cy="6" r="1.3"/><circle cx="15" cy="6" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="18" r="1.3"/>',
 link:'<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>'
};
const ic=(n,c='')=>'<svg viewBox="0 0 24 24" aria-hidden="true"'+(c?' class="'+c+'"':'')+'>'+P[n]+'</svg>';

/* ---------- sample data (seeded, so it looks the same on every load) ---------- */
let seed=20260;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const pick=a=>a[Math.floor(rnd()*a.length)];
const DAY=864e5,today=new Date();today.setHours(12,0,0,0);
let CAMPAIGNS=SRV?SRV.campaigns:store.get('campaigns',null)||[
 {id:'edu',en:'Education Fund',ar:'صندوق التعليم',den:'Support quality education for a brighter future.',dar:'ادعم التعليم الجيد من أجل مستقبل أفضل.',img:IMG+'community.jpg',goal:120000,cat:'Education',status:'active',ch:['web','kiosk'],end:30},
 {id:'food',en:'Food Support',ar:'الدعم الغذائي',den:'Provide meals to families in need.',dar:'وفّر الوجبات للأسر المحتاجة.',img:IMG+'food.jpg',goal:90000,cat:'Food',status:'active',ch:['web','kiosk'],end:5},
 {id:'med',en:'Medical Relief',ar:'الإغاثة الطبية',den:'Help provide essential healthcare.',dar:'ساعد في توفير الرعاية الصحية الأساسية.',img:IMG+'hospital.jpg',goal:150000,cat:'Health',status:'active',ch:['web','kiosk'],end:45},
 {id:'gaza',en:'Gaza Relief',ar:'إغاثة غزة',den:'Shelter, food and medical aid for families.',dar:'مأوى وغذاء ومساعدات طبية للأسر.',img:IMG+'gaza.jpg',goal:250000,cat:'Emergency',status:'active',ch:['web','kiosk'],end:60},
 {id:'water',en:'Clean Water Wells',ar:'آبار المياه',den:'Dig wells and install pumps.',dar:'حفر الآبار وتركيب المضخات.',img:IMG+'water.jpg',goal:80000,cat:'Water',status:'active',ch:['web'],end:20},
 {id:'orphan',en:'Orphan Sponsorship',ar:'كفالة الأيتام',den:'Education, healthcare and care for orphans.',dar:'تعليم ورعاية صحية للأيتام.',img:IMG+'sponsor-orphan.jpg',goal:60000,cat:'Sponsorship',status:'active',ch:['web','kiosk'],end:90},
 {id:'mosque',en:'Mosque Building',ar:'بناء مسجد',den:'Build mosques in communities in need.',dar:'بناء المساجد في المجتمعات المحتاجة.',img:IMG+'mosque.jpg',goal:200000,cat:'Mosques',status:'draft',ch:['web'],end:120},
 {id:'iftar',en:'Ramadan Iftar Meals',ar:'وجبات إفطار رمضان',den:'Iftar meals for fasting families and workers.',dar:'وجبات إفطار للصائمين والعمال.',img:IMG+'quran.jpg',goal:100000,cat:'Seasonal',status:'ended',ch:['web','kiosk'],end:-20}
];
const CITIES=SRV?SRV.cities:[['Dubai','دبي'],['Abu Dhabi','أبوظبي'],['Sharjah','الشارقة'],['Ajman','عجمان'],['Ras Al Khaimah','رأس الخيمة'],['Al Ain','العين'],['Fujairah','الفجيرة'],['Umm Al Quwain','أم القيوين']];
const KIOSKS=SRV?[]:[['Dubai Mall','Ground Floor, Near Entrance',0],['Mall of the Emirates','Level 1, Ski Dubai side',0],['Ibn Battuta Mall','China Court',0],['Dubai Festival City','Main Atrium',0],['Yas Mall','Main Atrium',1],['Abu Dhabi Mall','Level 2',1],['Al Wahda Mall','Food Court',1],['Dalma Mall','Gate 3',1],['City Centre Sharjah','Level 1',2],['Sahara Centre','Main Entrance',2],['Mega Mall','Ground Floor',2],['Al Zahia City Centre','Level 1',2],['Ajman City Centre','Main Entrance',3],['Al Ihsan HQ','Reception',3],['Ajman Hospital','Outpatient Hall',3],['Grand Mall Ajman','Ground Floor',3],['Manar Mall','Main Atrium',4],['Al Naeem Mall','Level 1',4],['Al Ain Mall','Ground Floor',5],['Bawadi Mall','Gate 1',5],['Fujairah City Centre','Main Entrance',6],['Lulu Fujairah','Entrance',6],['UAQ Mall','Ground Floor',7],['Al Qasimia Hospital','Main Lobby',4]].map((k,i)=>({id:'K'+String(i+1).padStart(2,'0'),name:k[0],spot:k[1],city:k[2],online:k[0]!=='City Centre Sharjah',sync:1+Math.floor(rnd()*9),paper:20+Math.floor(rnd()*80),uptime:(96+rnd()*4).toFixed(1)}));
if(!SRV)KIOSKS.find(k=>!k.online).sync=12;
const FIRST=['Ahmed','Fatima','Mohammed','Aisha','Omar','Mariam','Khalid','Noura','Saeed','Hessa','Rashid','Latifa','Yousef','Shamma','Ali','Moza','Hamad','Sara','Abdullah','Reem','Sultan','Amna','Majid','Hind'];
const LAST=['Al Nuaimi','Al Mansoori','Al Shamsi','Al Ketbi','Al Hammadi','Al Suwaidi','Al Mazrouei','Al Falasi','Al Dhaheri','Al Marri','Al Zaabi','Al Qubaisi'];
const DONORS=SRV?SRV.donors:Array.from({length:64},(_,i)=>({id:'DN'+String(1001+i),name:pick(FIRST)+' '+pick(LAST),phone:'05'+Math.floor(rnd()*9)+' '+String(Math.floor(rnd()*900)+100)+' '+String(Math.floor(rnd()*9000)+1000),city:Math.floor(rnd()*8),since:Math.floor(rnd()*900)}));
const CW=[.2,.2,.14,.2,.08,.1,0,.08];
const pickCamp=()=>{let r=rnd(),a=0;for(let i=0;i<CW.length;i++){a+=CW[i];if(r<a)return CAMPAIGNS[i]?.id||'edu'}return 'edu'};
const AMTS=[10,15,20,25,50,50,100,100,100,150,200,250,300,500,500,1000,2500,5000];
const toDates=list=>list.map(x=>Object.assign(x,{date:new Date(x.date)}));
const DONATIONS=SRV?toDates(SRV.donations):[];
if(!SRV)for(let d=95;d>=0;d--){const base=new Date(today.getTime()-d*DAY),n=8+Math.floor(rnd()*7)+Math.floor((95-d)/22);
  for(let j=0;j<n;j++){const kiosk=rnd()<.4,k=kiosk?pick(KIOSKS.filter(x=>x.online||d>0)):null,camp=pickCamp(),c=CAMPAIGNS.find(x=>x.id===camp);if(kiosk&&c&&!c.ch.includes('kiosk'))continue;
    const donor=kiosk&&rnd()<.6?null:pick(DONORS),t=new Date(base);t.setHours(8+Math.floor(rnd()*14),Math.floor(rnd()*60));
    DONATIONS.push({id:'',date:t,camp,ch:kiosk?'kiosk':'web',amt:pick(AMTS)*(rnd()<.08?2:1),pay:kiosk?pick(['Card','Card','Apple Pay','Cash']):pick(['Card','Card','Apple Pay','Google Pay','SMS']),kiosk:k?k.id:null,city:k?k.city:(donor?donor.city:3),donor:donor?donor.id:null,rc:!donor?'issued':rnd()<.95?'issued':rnd()<.6?'pending':'failed'})}}
if(SRV)DONATIONS.sort((a,b)=>b.date-a.date);else DONATIONS.sort((a,b)=>b.date-a.date).forEach((x,i)=>x.id='#D'+String(DONATIONS.length-i+1000).padStart(6,'0'));
let USERS=SRV?SRV.users:store.get('users',null)||[
 {name:'Admin',email:'admin@alihsan.ae',role:'admin',active:true,last:0},{name:'Mariam Al Shamsi',email:'mariam@alihsan.ae',role:'campaign',active:true,last:1},
 {name:'Khalid Al Ketbi',email:'khalid@alihsan.ae',role:'finance',active:true,last:3},{name:'Noura Al Falasi',email:'noura@alihsan.ae',role:'content',active:true,last:5},
 {name:'Saeed Al Zaabi',email:'saeed@alihsan.ae',role:'kiosk',active:true,last:24},{name:'Hessa Al Marri',email:'hessa@alihsan.ae',role:'viewer',active:false,last:240}];
const ROLES={admin:['Administrator','مدير النظام','r',14],campaign:['Campaign manager','مدير الحملات','g',9],finance:['Finance','المالية','gold',7],content:['Content editor','محرر المحتوى','b',6],kiosk:['Kiosk operator','مشغّل الأكشاك','v',4],viewer:['Viewer','مشاهد','',2]};
let PAGES=SRV?SRV.pages:store.get('pages',null)||[['Home','الرئيسية','index.html',1,0],['Projects & Campaigns','المشاريع والحملات','Projects%20%26%20Campaigns.html',1,2],['Direct Donation','التبرع المباشر','Direct%20Donation.html',1,1],['Zakat calculator','حاسبة الزكاة','zakat.html',1,9],['Sponsorship','الكفالة','sponsorship.html',1,6],['Personalised Projects','المشاريع المخصصة','PersonalisedProjects.html',1,4],['News','الأخبار','news.html',1,0],['Events','الفعاليات','event.html',1,3],['Volunteer','التطوع','Volunteer.html',1,1],['Ramadan Aman Portal','بوابة رمضان أمان','ramadhaportal.html',0,0],['Winter campaign landing','صفحة حملة الشتاء','index.html',0,0]].map(p=>({en:p[0],ar:p[1],url:p[2],pub:!!p[3],ed:p[4]}));
let MEDIA=SRV?SRV.media:[['endowment.jpg','Endowment banner'],['food.jpg','Food parcels'],['hospital.jpg','Al Safia Hospital'],['gaza.jpg','Gaza relief'],['water.jpg','Water project'],['community.jpg','Community day'],['volunteers.jpg','Volunteers'],['mosque.jpg','Mosque'],['quran.jpg','Quran centres'],['sponsor-orphan.jpg','Orphan sponsorship'],['media-award.jpg','Excellence award'],['media-zayed.jpg','Zayed Humanitarian Day'],['news.jpg','Partners meeting'],['care.jpg','Care'],['well.jpg','Well'],['giving.jpg','Giving']].map((m,i)=>({src:IMG+''+m[0],name:m[0],title:m[1],size:(180+i*37%400)+' KB',used:i%3?1:2}));
let NOTES=[{t:['Kiosk offline','كشك غير متصل'],d:['City Centre Sharjah stopped syncing 12 min ago','توقف كشك سيتي سنتر الشارقة عن المزامنة منذ 12 دقيقة'],ic:'alert',c:'r',go:'#kiosks/offline',u:1},{t:['2 content approvals','موافقتان على المحتوى'],d:['Campaign banners are ready for review','لافتات الحملات جاهزة للمراجعة'],ic:'file',c:'a',go:'#website',u:1},{t:['Campaign ending soon','حملة تنتهي قريبًا'],d:['Food Support ends in 5 days','حملة الدعم الغذائي تنتهي خلال 5 أيام'],ic:'clock',c:'b',go:'#campaigns',u:1},{t:['Large donation received','تم استلام تبرع كبير'],d:['AED 5,000 to Gaza Relief via website','5,000 درهم لإغاثة غزة عبر الموقع'],ic:'heart',c:'g',go:'#donations',u:0}];
let SETTINGS=SRV?SRV.settings:store.get('settings',{org:'Al Ihsan Charity Association',email:'info@alihsan.ae',phone:'800 16',cur:'AED',minAmt:10,applePay:true,gpay:true,sms:true,cash:true,autoReceipt:true,receiptAr:true,emailDaily:true,kioskAlert:true,bigGift:true,bigGiftAmt:5000});

/* ---------- helpers on data ---------- */
const camp=id=>CAMPAIGNS.find(c=>c.id===id)||{en:id,ar:id,img:'',goal:1};
const cname=id=>{const c=camp(id);return tr(c.en,c.ar)};
const city=i=>tr(CITIES[i][0],CITIES[i][1]);
const donor=id=>DONORS.find(d=>d.id===id);
const kiosk=id=>KIOSKS.find(k=>k.id===id);
const chChip=c=>c==='kiosk'?'<span class="chip g">'+tr('Kiosk','كشك')+'</span>':'<span class="chip b">'+tr('Website','الموقع')+'</span>';
const rcChip=s=>({issued:'<span class="chip g dot">'+tr('Issued','صادر')+'</span>',pending:'<span class="chip a dot">'+tr('Pending','قيد الانتظار')+'</span>',failed:'<span class="chip r dot">'+tr('Failed','فشل')+'</span>'})[s];
const payName=p=>({'Card':tr('Card','بطاقة'),'Apple Pay':'Apple Pay','Google Pay':'Google Pay','Cash':tr('Cash','نقدًا'),'SMS':tr('SMS','رسالة نصية')})[p]||p;
const raised=id=>SRV?(camp(id).raised||0):DONATIONS.filter(d=>d.camp===id).reduce((s,d)=>s+d.amt,0)*.45;
const pctOf=(r,g)=>g>0?Math.min(100,Math.round(r/g*100)):0;
/* live mode: notifications built from the real data */
const realNotes=()=>{const out=[],big=+SETTINGS.bigGiftAmt||5000,pend=DONATIONS.filter(d=>d.donor&&d.rc!=='issued').length,drafts=CAMPAIGNS.filter(c=>c.status==='draft').length;
  DONATIONS.filter(d=>d.amt>=big&&today-d.date<7*DAY).slice(0,3).forEach(d=>{const c=camp(d.camp);out.push({t:['Large donation received','تم استلام تبرع كبير'],d:[CUR+' '+nf(d.amt)+' to '+c.en,nf(d.amt)+' '+CUR+' لـ'+c.ar],ic:'heart',c:'g',go:'#donations/'+encodeURIComponent(d.id),u:1})});
  if(pend)out.push({t:[pend+' receipts not issued',pend+' إيصالات لم تصدر'],d:['Confirmed donations without a posted invoice','تبرعات مؤكدة بدون فاتورة مرحّلة'],ic:'receipt',c:'v',go:'#receipts',u:1});
  if(drafts)out.push({t:[drafts+' draft campaigns',drafts+' حملات مسودة'],d:['Not published on the website yet','غير منشورة على الموقع بعد'],ic:'file',c:'a',go:'#campaigns',u:1});
  return out};
const ago=m=>m<1?tr('just now','الآن'):m<60?tr(m+' min ago','منذ '+m+' دقيقة'):m<1440?tr(Math.round(m/60)+' h ago','منذ '+Math.round(m/60)+' ساعة'):tr(Math.round(m/1440)+' days ago','منذ '+Math.round(m/1440)+' يوم');

if(SRV)NOTES=realNotes();

/* ---------- shell: nav, language, menus ---------- */
const NAV=[['overview','home','Overview','نظرة عامة'],['website','web','Website','الموقع'],['campaigns','mega','Campaigns','الحملات'],['kiosks','kiosk','Kiosks','الأكشاك'],['_','','Donations','التبرعات'],['donations','card','Donations','التبرعات'],['donors','users','Donors','المتبرعون'],['receipts','receipt','Receipts','الإيصالات'],['reports','chart','Reports','التقارير'],['_','','Manage','الإدارة'],['media','image','Media','الوسائط'],['users','shield','Users & Roles','المستخدمون والصلاحيات'],['settings','gear','Settings','الإعدادات']];
const drawNav=()=>{const off=KIOSKS.filter(k=>!k.online).length,pend=DONATIONS.filter(d=>d.donor&&d.rc!=='issued').length;
  $('#db-nav').innerHTML=NAV.map(n=>n[0]==='_'?'<div class="db-sec">'+tr(n[2],n[3])+'</div>':'<a href="#'+n[0]+'" data-r="'+n[0]+'">'+ic(n[1])+'<span>'+tr(n[2],n[3])+'</span>'+(n[0]==='kiosks'&&off?'<span class="db-badge">'+off+'</span>':n[0]==='receipts'&&pend?'<span class="db-badge">'+pend+'</span>':'')+'</a>').join('');markNav()};
const markNav=()=>{const r=route().view;$$('#db-nav a').forEach(a=>{const on=a.dataset.r===r;a.classList.toggle('on',on);on?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current')})};
$$('[data-ar]').forEach(e=>e.dataset.en=e.innerHTML);
const setLang=l=>{LANG=l;document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';
  $$('[data-ar]').forEach(e=>e.innerHTML=e.dataset[l==='ar'?'ar':'en']);
  const q=$('#db-q');q.placeholder=l==='ar'?q.dataset.arPh:'Search campaigns, donations, donors, kiosks…';
  $$('.db-lang button').forEach(b=>b.classList.toggle('on',b.dataset.lang===l));store.set('lang',l);drawNav();drawNotes();render()};
$$('.db-lang button').forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.lang)));
/* mobile drawer */
const db=$('#db'),scrim=$('#db-scrim'),burger=$('#db-burger');
const drawer=o=>{db.classList.toggle('nav-open',o);scrim.hidden=!o;burger.setAttribute('aria-expanded',String(o))};
burger.addEventListener('click',()=>drawer(!db.classList.contains('nav-open')));scrim.addEventListener('click',()=>drawer(false));
$('#db-side').addEventListener('click',e=>{if(e.target.closest('a'))drawer(false)});
/* popovers */
const pops=[[$('#db-bell'),$('#db-notes')],[$('#db-user'),$('#db-umenu')]];
pops.forEach(([b,p])=>b.addEventListener('click',e=>{e.stopPropagation();const o=p.hidden;pops.forEach(([x,y])=>{y.hidden=true;x.setAttribute('aria-expanded','false')});p.hidden=!o;b.setAttribute('aria-expanded',String(o))}));
document.addEventListener('click',e=>{if(!e.target.closest('.db-pop-wrap'))pops.forEach(([b,p])=>{p.hidden=true;b.setAttribute('aria-expanded','false')})});
const drawNotes=()=>{$('#db-notes').innerHTML='<h4>'+tr('Notifications','الإشعارات')+'<button type="button" id="db-readall">'+tr('Mark all read','تحديد الكل كمقروء')+'</button></h4>'+NOTES.map((n,i)=>'<a class="db-note'+(n.u?' unread':'')+'" href="'+n.go+'" data-note="'+i+'"><span class="ic '+n.c+' db-ni">'+ic(n.ic)+'</span><span><b>'+tr(n.t[0],n.t[1])+'</b><small>'+tr(n.d[0],n.d[1])+'</small></span></a>').join('');
  $('#db-bell-dot').hidden=!NOTES.some(n=>n.u)};
$('#db-notes').addEventListener('click',e=>{if(e.target.id==='db-readall'){NOTES.forEach(n=>n.u=0);drawNotes();return}const a=e.target.closest('[data-note]');if(a){NOTES[a.dataset.note].u=0;drawNotes();$('#db-notes').hidden=true}});
/* global search */
$('#db-search').addEventListener('submit',e=>{e.preventDefault();const q=$('#db-q').value.trim();location.hash='#search/'+encodeURIComponent(q)});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!/input|textarea|select/i.test(document.activeElement.tagName)){e.preventDefault();$('#db-q').focus()}if(e.key==='Escape')drawer(false)});

/* ---------- toast + modal ---------- */
/* toast(message, {sub, type:'ok'|'err'}). The box is a popover so it also shows above an open modal dialog. */
const toast=(m,o={})=>{const box=$('#db-toasts'),t=document.createElement('div'),err=o.type==='err';t.className='toast'+(err?' err':'');t.setAttribute('role',err?'alert':'status');
  t.innerHTML=ic(err?'alert':'check')+'<span><b>'+esc(m)+'</b>'+(o.sub?'<small>'+esc(o.sub)+'</small>':'')+'</span>';box.append(t);
  if(box.showPopover){try{if(box.matches(':popover-open'))box.hidePopover();box.showPopover()}catch(e){}}
  setTimeout(()=>{t.classList.add('out');setTimeout(()=>{t.remove();if(!box.children.length&&box.hidePopover){try{box.hidePopover()}catch(e){}}},250)},err?6000:o.sub?4200:3200)};
/* disable the modal's save button with a spinner while ``p`` runs */
const saving=p=>{const b=$('#db-modal-form [type=submit]'),html=b&&b.innerHTML;if(b){b.disabled=true;b.innerHTML='<i class="spin" aria-hidden="true"></i>'+tr('Saving…','جارٍ الحفظ…')}
  return Promise.resolve(p).finally(()=>{if(b&&b.isConnected){b.disabled=false;b.innerHTML=html}})};
const dlg=$('#db-modal'),mform=$('#db-modal-form');let onSave=null;
const modal=(title,body,save,saveTxt,extra='')=>{onSave=save;
  mform.innerHTML='<div class="db-modal-h"><h2 id="db-modal-t">'+title+'</h2><button type="button" class="db-x" data-close aria-label="'+tr('Close','إغلاق')+'">×</button></div>'+body+'<div class="db-modal-f">'+extra+'<button type="button" class="btn btn-g" data-close>'+tr('Cancel','إلغاء')+'</button>'+(save?'<button type="submit" class="btn btn-p">'+(saveTxt||tr('Save','حفظ'))+'</button>':'')+'</div>';
  dlg.showModal?dlg.showModal():dlg.setAttribute('open','');setTimeout(()=>{const f=mform.querySelector('input,select,textarea');f&&f.focus()},40)};
const closeModal=()=>dlg.close?dlg.close():dlg.removeAttribute('open');
mform.addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeModal()});
dlg.addEventListener('click',e=>{if(e.target===dlg)closeModal()});
mform.addEventListener('submit',e=>{e.preventDefault();if(!onSave)return closeModal();let ok=true;
  $$('[required]',mform).forEach(f=>{const bad=!String(f.value).trim();f.setAttribute('aria-invalid',String(bad));const er=f.parentElement.querySelector('.err');if(er)er.textContent=bad?tr('Required','مطلوب'):'';if(bad&&ok){f.focus();ok=false}});
  if(ok&&onSave(new FormData(mform))!==false)closeModal()});
const fld=(name,label,input,req)=>'<div class="fld"><label for="m-'+name+'">'+label+(req?' *':'')+'</label>'+input+'<span class="err"></span></div>';

/* ---------- charts ---------- */
/* monotone cubic curve (never overshoots the data, so it can't dip below zero) */
const smooth=pts=>{const n=pts.length;if(n<3)return pts.map((p,i)=>(i?'L':'M')+p[0]+','+p[1]).join(' ');const dx=[],m=[],t=[];for(let i=0;i<n-1;i++){dx[i]=pts[i+1][0]-pts[i][0];m[i]=(pts[i+1][1]-pts[i][1])/dx[i]}t[0]=m[0];t[n-1]=m[n-2];for(let i=1;i<n-1;i++)t[i]=m[i-1]*m[i]<=0?0:3*(dx[i-1]+dx[i])/((2*dx[i]+dx[i-1])/m[i-1]+(dx[i]+2*dx[i-1])/m[i]);let d='M'+pts[0][0]+','+pts[0][1];for(let i=0;i<n-1;i++){const h=dx[i]/3;d+=' C'+(pts[i][0]+h)+','+(pts[i][1]+t[i]*h)+' '+(pts[i+1][0]-h)+','+(pts[i+1][1]-t[i+1]*h)+' '+pts[i+1][0]+','+pts[i+1][1]}return d};
/* drawn at the card's real width, so labels stay readable on phones (redrawn on resize) */
const lineChart=(host,labels,series)=>{const W=Math.max(300,Math.round(host.clientWidth||720)),H=W<520?230:260,L=44,R=12,T=14,B=30,vis=series.filter(s=>!s.off);
  const max=Math.max(10,...vis.flatMap(s=>s.data)),step=Math.pow(10,Math.floor(Math.log10(max/4))),nice=Math.ceil(max/4/step)*step*4;
  const x=i=>L+(labels.length<2?0:i*(W-L-R)/(labels.length-1)),y=v=>T+(H-T-B)*(1-v/nice);
  let g='';for(let k=0;k<=4;k++){const v=nice*k/4;g+='<line class="gl" x1="'+L+'" x2="'+(W-R)+'" y1="'+y(v)+'" y2="'+y(v)+'"/><text class="ax" x="'+(L-8)+'" y="'+(y(v)+4)+'" text-anchor="end">'+kfmt(v)+'</text>'}
  const every=Math.ceil(labels.length/Math.max(3,Math.floor(W/90)));labels.forEach((l,i)=>{if(i%every===0||(i===labels.length-1&&i%every>=every/2))g+='<text class="ax" x="'+x(i)+'" y="'+(H-8)+'" text-anchor="middle">'+l+'</text>'});
  let s='<defs>'+vis.map((se,k)=>'<linearGradient id="ga'+k+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+se.color+'" stop-opacity=".18"/><stop offset="1" stop-color="'+se.color+'" stop-opacity="0"/></linearGradient>').join('')+'</defs>';
  vis.forEach((se,k)=>{const pts=se.data.map((v,i)=>[x(i),y(v)]),d=smooth(pts);s+='<path d="'+d+' L'+x(labels.length-1)+','+y(0)+' L'+x(0)+','+y(0)+'Z" fill="url(#ga'+k+')"/><path class="ln" d="'+d+'" stroke="'+se.color+'"/>';if(labels.length<=40)s+=pts.map(p=>'<circle class="pt" cx="'+p[0]+'" cy="'+p[1]+'" r="3.5" fill="'+se.color+'"/>').join('')});
  host.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+tr('Donation trend chart','مخطط اتجاه التبرعات')+'">'+g+s+'<line class="cur" id="cur" y1="'+T+'" y2="'+(H-B)+'" hidden/><rect class="hv" x="'+L+'" y="0" width="'+(W-L-R)+'" height="'+H+'"/></svg><div class="tip" hidden></div>';
  const svg=host.querySelector('svg'),tip=host.querySelector('.tip'),cur=svg.querySelector('#cur');
  const move=ev=>{const r=svg.getBoundingClientRect(),px=(ev.clientX-r.left)/r.width*W;let i=Math.round((px-L)/((W-L-R)/Math.max(1,labels.length-1)));i=Math.max(0,Math.min(labels.length-1,i));
    cur.setAttribute('x1',x(i));cur.setAttribute('x2',x(i));cur.removeAttribute('hidden');tip.hidden=false;
    tip.innerHTML='<b>'+labels[i]+'</b>'+vis.map(se=>'<div><i style="background:'+se.color+'"></i>'+se.name+': '+aed(se.data[i])+'</div>').join('');
    tip.style.left=(x(i)/W*100)+'%';tip.style.top=(Math.min(...vis.map(se=>y(se.data[i])))/H*100)+'%'};
  svg.addEventListener('pointermove',move);svg.addEventListener('pointerdown',move);svg.addEventListener('pointerleave',()=>{tip.hidden=true;cur.setAttribute('hidden','')})};
const donut=(parts,total,label)=>{let off=0;const sum=parts.reduce((s,p)=>s+p.v,0)||1;
  return '<div class="donut-w"><div class="donut"><svg viewBox="0 0 200 200">'+parts.map(p=>{const pc=p.v/sum*100,c='<circle cx="100" cy="100" r="80" pathLength="100" stroke="'+p.color+'" stroke-dasharray="'+Math.max(0,pc-.6)+' '+(100-Math.max(0,pc-.6))+'" stroke-dashoffset="'+(-off)+'"><title>'+esc(p.name)+' — '+pc.toFixed(1)+'%</title></circle>';off+=pc;return c}).join('')+'</svg><div class="donut-c"><small>'+label+'</small><b>'+total+'</b><small>'+tr('Total','الإجمالي')+'</small></div></div>'+
  '<div class="dl">'+parts.map(p=>'<div><i style="background:'+p.color+'"></i><b>'+p.name+'</b><em>'+Math.round(p.v/sum*100)+'%</em><small>'+aed(p.v)+'</small></div>').join('')+'</div></div>'};
const bars=(rows,gold)=>'<div class="bars">'+rows.map(r=>'<div class="bar-r"><b title="'+esc(r.n)+'">'+esc(r.n)+'</b><div class="track'+(gold?' gold':'')+'"><i style="width:'+r.p+'%"></i></div><span>'+r.v+'</span></div>').join('')+'</div>';

/* ---------- tables (search, sort, paging) ---------- */
const TS={};
const table=(id,cfg)=>{TS[id]=Object.assign({q:'',sort:cfg.sort||null,dir:cfg.dir||-1,page:1,per:cfg.per||10},TS[id]||{},{cfg});return '<div id="t-'+id+'"></div>'};
const drawTable=id=>{const st=TS[id],c=st.cfg,host=$('#t-'+id);if(!host)return;
  let rows=c.rows();if(st.q){const q=st.q.toLowerCase();rows=rows.filter(r=>c.text(r).toLowerCase().includes(q))}
  if(st.sort){const col=c.cols.find(x=>x.k===st.sort);rows=[...rows].sort((a,b)=>{const va=col.v(a),vb=col.v(b);return (va>vb?1:va<vb?-1:0)*st.dir})}
  const pages=Math.max(1,Math.ceil(rows.length/st.per));st.page=Math.min(st.page,pages);const sl=rows.slice((st.page-1)*st.per,st.page*st.per);
  host.innerHTML='<div class="tbl-w"><table><thead><tr>'+c.cols.map(col=>'<th'+(col.v?' data-sort="'+col.k+'"'+(st.sort===col.k?' class="'+(st.dir>0?'asc':'desc')+'" aria-sort="'+(st.dir>0?'ascending':'descending')+'"':''):'')+'>'+col.h()+'</th>').join('')+'</tr></thead><tbody>'+
    (sl.length?sl.map(r=>'<tr>'+c.cols.map(col=>'<td'+(col.cls?' class="'+col.cls+'"':'')+'>'+col.r(r)+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="'+c.cols.length+'"><div class="empty"><b>'+tr('No results','لا توجد نتائج')+'</b>'+tr('Try a different search or filter.','جرّب بحثًا أو فلترًا مختلفًا.')+'</div></td></tr>')+'</tbody></table></div>'+
    (c.noPager?'':'<div class="pager"><span>'+tr('Showing','عرض')+' '+(rows.length?(st.page-1)*st.per+1:0)+'–'+Math.min(st.page*st.per,rows.length)+' '+tr('of','من')+' '+nf(rows.length)+'</span><div><button type="button" data-pg="prev" '+(st.page<2?'disabled':'')+' aria-label="'+tr('Previous page','الصفحة السابقة')+'">'+(LANG==='ar'?'›':'‹')+'</button>'+pageBtns(st.page,pages)+'<button type="button" data-pg="next" '+(st.page>=pages?'disabled':'')+' aria-label="'+tr('Next page','الصفحة التالية')+'">'+(LANG==='ar'?'‹':'›')+'</button></div></div>');
  host.onclick=e=>{const th=e.target.closest('th[data-sort]');if(th){st.dir=st.sort===th.dataset.sort?-st.dir:-1;st.sort=th.dataset.sort;drawTable(id);return}
    const pb=e.target.closest('[data-pg]');if(pb&&!pb.disabled){const v=pb.dataset.pg;st.page=v==='prev'?st.page-1:v==='next'?st.page+1:+v;drawTable(id)}}};
const pageBtns=(p,n)=>{const s=new Set([1,n,p-1,p,p+1].filter(x=>x>=1&&x<=n));let out='',last=0;[...s].sort((a,b)=>a-b).forEach(x=>{if(x-last>1)out+='<button type="button" disabled>…</button>';out+='<button type="button" data-pg="'+x+'"'+(x===p?' class="on" aria-current="page"':'')+'>'+x+'</button>';last=x});return out};
const searchBox=(id,ph)=>'<input class="db-input" type="search" data-tq="'+id+'" placeholder="'+ph+'" aria-label="'+ph+'" value="'+esc(TS[id]?.q||'')+'">';

/* ---------- filters ---------- */
const F=Object.assign({period:'30',camp:'all',ch:'all',loc:'all'},store.get('filters',{}));
const sel=(k,icon,opts,label)=>'<label class="db-sel">'+ic(icon)+'<select data-f="'+k+'" aria-label="'+label+'">'+opts.map(o=>'<option value="'+o[0]+'"'+(F[k]===o[0]?' selected':'')+'>'+o[1]+'</option>').join('')+'</select></label>';
const filterBar=()=>'<div class="db-filters">'+sel('period','cal',[['7',tr('Last 7 days','آخر 7 أيام')],['30',tr('Last 30 days','آخر 30 يومًا')],['90',tr('Last 90 days','آخر 90 يومًا')]],tr('Period','الفترة'))+
  sel('camp','mega',[['all',tr('All campaigns','كل الحملات')]].concat(CAMPAIGNS.map(c=>[c.id,tr(c.en,c.ar)])),tr('Campaign','الحملة'))+
  sel('ch','layers',[['all',tr('All channels','كل القنوات')],['web',tr('Website','الموقع')],['kiosk',tr('Kiosks','الأكشاك')]],tr('Channel','القناة'))+
  sel('loc','pin',[['all',tr('All locations','كل المواقع')]].concat(CITIES.map((c,i)=>[String(i),tr(c[0],c[1])])),tr('Location','الموقع'))+
  '<label class="db-sel">'+ic('money')+'<select aria-label="'+tr('Currency','العملة')+'"><option>'+CUR+'</option></select></label></div>';
const inRange=(d,from,to)=>d.date>=from&&d.date<to;
const filtered=(off=0)=>{const days=+F.period,to=new Date(today.getTime()+DAY/2-off*days*DAY),from=new Date(to.getTime()-days*DAY);
  return DONATIONS.filter(d=>inRange(d,from,to)&&(F.camp==='all'||d.camp===F.camp)&&(F.ch==='all'||d.ch===F.ch)&&(F.loc==='all'||String(d.city)===F.loc))};
const delta=(a,b)=>{if(!b)return '';const p=(a-b)/b*100;return '<span class="trend'+(p<0?' down':'')+'">'+ic(p<0?'down':'up')+(p>=0?'+':'')+p.toFixed(0)+'% '+tr('vs previous period','مقارنة بالفترة السابقة')+'</span>'};

/* ---------- views ---------- */
const head=(t,s,act='')=>'<div class="db-head"><div><h1>'+t+'</h1>'+(s?'<p>'+s+'</p>':'')+'</div>'+(act?'<div class="db-actions">'+act+'</div>':'')+'</div>';
const V={};
/* =================== overview v2: bento layout, modern charts, live feed =================== */
const kpi=(i,c,l,v,t,go)=>'<a class="card kpi" href="'+go+'"><span class="ic '+c+'">'+ic(i)+'</span><span><small>'+l+'</small><b>'+v+'</b>'+t+'</span></a>';
const att=(i,c,t,s,go)=>'<a class="att" href="'+go+'"><span class="ic '+c+'">'+ic(i)+'</span><span class="row-t"><b>'+t+'</b><small>'+s+'</small></span>'+ic('chev')+'</a>';
const WIDGETS=[['goal','Monthly goal','الهدف الشهري'],['kpis','Key figures','الأرقام الرئيسية'],['trend','Donation trends','اتجاهات التبرعات'],['channel','Channel split','توزيع القنوات'],['heat','Activity heatmap','خريطة النشاط'],['perf','Campaign performance','أداء الحملات'],['live','Live donations','التبرعات المباشرة'],['kiosk','Kiosk health','حالة الأكشاك'],['insights','Smart insights','رؤى ذكية'],['recent','Recent donations','أحدث التبرعات'],['attention','Needs attention','يحتاج إلى متابعة']];
let HIDDEN=store.get('hidden',[]);
const on=w=>!HIDDEN.includes(w);
let trendMode='day',trendMetric='amt',trendShow=Object.assign({web:true,kiosk:true,prev:true,fc:true},store.get('trendShow',{}));
let LIVE=store.get('live',true),liveT=null;
let GOAL=+SETTINGS.monthlyGoal||420000;
let gid=0;
/* tiny area sparkline */
const spark=(data,color,o={})=>{const w=100,h=o.h||32,mx=Math.max(1,...data),mn=o.zero?0:Math.min(...data),r=mx-mn||1,id='sp'+(++gid);
  const pts=data.map((v,i)=>[data.length<2?0:i*w/(data.length-1),h-2-(v-mn)/r*(h-6)]),d=smooth(pts);
  return '<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+color+'" stop-opacity="'+(o.op||.28)+'"/><stop offset="1" stop-color="'+color+'" stop-opacity="0"/></linearGradient></defs><path d="'+d+' L'+w+','+h+' L0,'+h+'Z" fill="url(#'+id+')" stroke="none"/><path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+(o.sw||2)+'" vector-effect="non-scaling-stroke" stroke-linecap="round"/></svg>'};
/* number count-up for [data-count] */
const countUp=root=>$$('[data-count]',root).forEach(el=>{const to=+el.dataset.count,f=el.dataset.fmt,from=+(el.dataset.from||0),t0=performance.now(),D=900,show=v=>el.textContent=f==='aed'?aed(v):f==='pct'?Math.round(v)+'%':nf(v);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){show(to);return}
  const step=t=>{const p=Math.min(1,(t-t0)/D),e=1-Math.pow(1-p,3);show(from+(to-from)*e);if(p<1)requestAnimationFrame(step)};requestAnimationFrame(step)});
/* per-day series over the selected period */
const periodDays=()=>{const n=+F.period,out=[];for(let i=n-1;i>=0;i--)out.push(new Date(today.getTime()-i*DAY).toDateString());return out};
const daily=(list,fn=d=>d.amt)=>{const m={};list.forEach(d=>{const k=d.date.toDateString();m[k]=(m[k]||0)+fn(d)});return periodDays().map(k=>m[k]||0)};
const greet=()=>{const h=new Date().getHours();return h<12?tr('Good morning','صباح الخير'):h<17?tr('Good afternoon','مساء الخير'):tr('Good evening','مساء الخير')};

V.overview=()=>{const cur=filtered(),prev=filtered(1),sum=a=>a.reduce((s,d)=>s+d.amt,0),tot=sum(cur),ptot=sum(prev),pct=ptot?(tot-ptot)/ptot*100:0;
  const donorsN=new Set(cur.map(d=>d.donor).filter(Boolean)).size,avg=cur.length?tot/cur.length:0,pavg=prev.length?ptot/prev.length:0;
  const online=KIOSKS.filter(k=>k.online).length;
  const mStart=new Date(today.getFullYear(),today.getMonth(),1),dim=new Date(today.getFullYear(),today.getMonth()+1,0).getDate(),dom=today.getDate();
  const month=DONATIONS.filter(d=>d.date>=mStart).reduce((s,d)=>s+d.amt,0),proj=month/dom*dim,gp=Math.min(100,month/GOAL*100);
  const dTot=daily(cur),dCnt=daily(cur,()=>1),dAvg=dTot.map((v,i)=>dCnt[i]?v/dCnt[i]:0),dDon=periodDays().map(k=>new Set(cur.filter(d=>d.donor&&d.date.toDateString()===k).map(d=>d.donor)).size);
  const k2=(i,c,col,l,v,f,dl,data,go)=>'<a class="card kpi2 s3" href="'+go+'"><div class="kpi2-h"><small>'+l+'</small><span class="ic '+c+'">'+ic(i)+'</span></div><div class="kpi2-r"><b data-count="'+v+'" data-fmt="'+f+'">0</b>'+dl+'</div><div class="spark">'+spark(data,col,{h:40})+'</div></a>';
  const pill=(a,b)=>{if(!b)return '';const p=(a-b)/b*100;return '<span class="trend'+(p<0?' down':'')+'">'+ic(p<0?'down':'up')+(p>=0?'+':'')+p.toFixed(0)+'%</span>'};
  const ending=CAMPAIGNS.filter(c=>c.status==='active'&&c.end!=null).sort((a,b)=>a.end-b.end)[0];
  const pend=DONATIONS.filter(d=>d.donor&&d.rc!=='issued').length;
  return '<div class="db-head" style="margin-bottom:14px"><div></div><div class="db-actions"><button class="btn btn-g btn-sm" type="button" data-act="customize">'+ic('layers')+tr('Customize','تخصيص')+'</button></div></div>'+filterBar()+
  '<div class="bento">'+
  /* hero */
  '<section class="hero '+(on('goal')?'s8':'s12')+'"><div class="hero-top"><div><p class="hero-hi">'+greet()+', '+(SRV?esc(SRV.user.name.split(' ')[0]):tr('Admin','المسؤول'))+' 👋</p><h1>'+tr('Here’s how giving is going','إليك سير العطاء')+'</h1></div><button type="button" class="hero-live'+(LIVE?'':' paused')+'" data-act="toggleLive" aria-pressed="'+LIVE+'"><i></i>'+(LIVE?(SRV?tr('Live','مباشر'):tr('Live · simulated','مباشر · محاكاة')):tr('Live paused','البث متوقف'))+'</button></div>'+
   '<div class="hero-body"><div class="hero-k"><small>'+tr('Total donations · ','إجمالي التبرعات · ')+periodLabel()+'</small><b id="hero-total" data-count="'+tot+'" data-fmt="aed">0</b><span class="pill'+(pct<0?' down':'')+'">'+ic(pct<0?'down':'up')+(pct>=0?'+':'')+pct.toFixed(1)+'% '+tr('vs previous period','مقارنة بالفترة السابقة')+'</span>'+
   '<div class="hero-meta"><div><small>'+tr('Transactions','المعاملات')+'</small><b id="hero-tx">'+nf(cur.length)+'</b></div><div><small>'+tr('Average gift','متوسط التبرع')+'</small><b>'+aed(avg)+'</b></div><div><small>'+tr('Donors','المتبرعون')+'</small><b>'+nf(donorsN)+'</b></div><div><small>'+tr('Kiosks online','الأكشاك المتصلة')+'</small><b>'+online+'/'+KIOSKS.length+'</b></div></div>'+
   '<div class="hero-actions"><button class="btn btn-p btn-sm" type="button" data-act="newCampaign">'+ic('plus')+tr('Create campaign','إنشاء حملة')+'</button><a class="btn btn-g btn-sm" href="/" target="_blank" rel="noopener">'+ic('eye')+tr('Preview site','معاينة الموقع')+'</a><button class="btn btn-g btn-sm" type="button" data-act="exportCsv">'+ic('download')+tr('Export','تصدير')+'</button></div></div>'+
   '<div class="hero-spark">'+spark(dTot,'#8ff7bd',{h:60,op:.35,sw:2.4,zero:true})+'</div></div></section>'+
  /* goal gauge */
  (on('goal')?'<section class="card s4 gauge"><div class="card-h" style="padding:0;width:100%"><h3>'+tr('Monthly goal','الهدف الشهري')+'<span class="sub">'+dfmt(today,{month:'long',year:'numeric'})+'</span></h3><span class="chip '+(proj>=GOAL?'g':'a')+' dot">'+(proj>=GOAL?tr('On track','على المسار'):tr('Behind pace','متأخر'))+'</span></div>'+
   '<div class="gauge-w"><svg viewBox="0 0 200 200" aria-hidden="true"><defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00a251"/><stop offset="1" stop-color="#d9b564"/></linearGradient></defs><circle class="g-bg" cx="100" cy="100" r="80" pathLength="100" stroke-dasharray="75 100"/><circle class="g-fg" id="g-fg" cx="100" cy="100" r="80" pathLength="100" stroke-dasharray="0 100" data-to="'+(gp*.75).toFixed(2)+'"/></svg><div class="gauge-c"><b data-count="'+gp+'" data-fmt="pct">0%</b><small>'+tr('of','من')+' '+aed(GOAL)+'</small></div></div>'+
   '<div class="gauge-f"><div><small>'+tr('Raised','تم جمعه')+'</small><b>'+aed(month)+'</b></div><div><small>'+tr('Projected','المتوقع')+'</small><b>'+aed(proj)+'</b></div></div></section>':'')+
  /* KPIs */
  (on('kpis')?k2('swap','b','#2f6fed',tr('Transactions','المعاملات'),cur.length,'n',pill(cur.length,prev.length),dCnt,'#donations')+
   k2('coins','g','#00a251',tr('Average gift','متوسط التبرع'),avg,'aed',pill(avg,pavg),dAvg,'#reports')+
   k2('users','v','#7c5cdb',tr('Unique donors','متبرعون فريدون'),donorsN,'n',pill(donorsN,new Set(prev.map(d=>d.donor).filter(Boolean)).size),dDon,'#donors')+
   k2('kiosk','a','#d98a00',tr('Kiosk revenue','إيرادات الأكشاك'),sum(cur.filter(d=>d.ch==='kiosk')),'aed',pill(sum(cur.filter(d=>d.ch==='kiosk')),sum(prev.filter(d=>d.ch==='kiosk'))),daily(cur.filter(d=>d.ch==='kiosk')),'#kiosks'):'')+
  /* trend */
  (on('trend')?'<section class="card '+(on('channel')?'s8':'s12')+'"><div class="card-h"><h3>'+tr('Donation trends','اتجاهات التبرعات')+'<span class="sub" id="trend-sub"></span></h3><div class="card-tools"><div class="seg" role="group" aria-label="'+tr('Metric','المقياس')+'"><button type="button" data-tmet="amt" class="'+(trendMetric==='amt'?'on':'')+'">'+tr('Amount','المبلغ')+'</button><button type="button" data-tmet="cnt" class="'+(trendMetric==='cnt'?'on':'')+'">'+tr('Count','العدد')+'</button></div><div class="seg" role="group" aria-label="'+tr('Group by','التجميع حسب')+'"><button type="button" data-tm="day" class="'+(trendMode==='day'?'on':'')+'">'+tr('Daily','يومي')+'</button><button type="button" data-tm="week" class="'+(trendMode==='week'?'on':'')+'">'+tr('Weekly','أسبوعي')+'</button></div></div></div>'+
   '<div class="card-b"><div class="card-tools" id="trend-keys" style="margin-bottom:10px"></div><div class="chart2" id="trend"></div></div></section>':'')+
  (on('channel')?'<section class="card '+(on('trend')?'s4':'s12')+'"><div class="card-h"><h3>'+tr('Channel split','توزيع القنوات')+'<span class="sub">'+periodLabel()+'</span></h3></div><div class="card-b">'+rings(cur)+'</div></section>':'')+
  /* heatmap + performance */
  (on('heat')?'<section class="card '+(on('perf')?'s6':'s12')+'"><div class="card-h"><h3>'+tr('When people give','متى يتبرع الناس')+'<span class="sub" id="heat-sub"></span></h3></div><div class="card-b">'+heatmap(cur)+'</div></section>':'')+
  (on('perf')?'<section class="card '+(on('heat')?'s6':'s12')+'"><div class="card-h"><h3>'+tr('Campaign performance','أداء الحملات')+'<span class="sub">'+tr('Raised vs goal · daily trend','المجموع مقابل الهدف · الاتجاه اليومي')+'</span></h3><a class="link" href="#campaigns">'+tr('Manage','إدارة')+ic('arrow')+'</a></div><div class="card-b"><div class="perf">'+
   CAMPAIGNS.filter(c=>c.status==='active').map(c=>({c,t:sum(cur.filter(d=>d.camp===c.id)),p:pctOf(raised(c.id),c.goal)})).sort((a,b)=>b.t-a.t).slice(0,5).map(x=>'<a class="perf-r" href="#campaigns"><img src="'+x.c.img+'" alt=""><span style="min-width:0"><b>'+tr(x.c.en,x.c.ar)+'</b><div class="track"><i style="width:'+x.p+'%"></i></div></span><span class="mini">'+spark(daily(cur.filter(d=>d.camp===x.c.id)),'#00a251',{h:30,op:.18})+'</span><strong>'+kfmt(x.t)+'<small>'+x.p+'% '+tr('of goal','من الهدف')+'</small></strong></a>').join('')+'</div></div></section>':'')+
  /* live, kiosks, insights */
  (on('live')?'<section class="card s4 half"><div class="card-h"><h3>'+tr('Live donations','التبرعات المباشرة')+'<span class="sub">'+(LIVE?(SRV?tr('Refreshes every 30 seconds','يتحدث كل 30 ثانية'):tr('Updating every few seconds (simulated)','تحديث كل بضع ثوانٍ (محاكاة)')):tr('Paused','متوقف'))+'</span></h3><span class="hero-live" style="background:var(--g3);color:var(--g-ink);border-color:transparent" data-act="toggleLive" role="button" tabindex="0"><i></i>'+(LIVE?tr('Live','مباشر'):tr('Paused','متوقف'))+'</span></div><div class="card-b"><div class="feed" id="feed">'+DONATIONS.slice(0,7).map(feedItem).join('')+'</div></div></section>':'')+
  (on('kiosk')?'<section class="card s4 half"><div class="card-h"><h3>'+tr('Kiosk health','حالة الأكشاك')+'<span class="sub">'+online+' '+tr('online','متصل')+' · '+(KIOSKS.length-online)+' '+tr('offline','غير متصل')+'</span></h3><a class="link" href="#kiosks">'+tr('All','الكل')+ic('arrow')+'</a></div><div class="card-b">'+(KIOSKS.length?'':'<div class="empty"><b>'+tr('No kiosks connected','لا توجد أكشاك متصلة')+'</b>'+tr('Kiosk donations will appear here once kiosks are linked.','ستظهر تبرعات الأكشاك هنا بعد ربط الأكشاك.')+'</div>')+'<div class="kgrid">'+KIOSKS.map(k=>'<a href="#kiosks'+(k.online?'':'/offline')+'" class="'+(k.online?'':'off')+'" title="'+esc(k.name+' — '+(k.online?tr('Online','متصل'):tr('Offline','غير متصل')))+'">'+k.id.slice(1)+'</a>').join('')+'</div>'+
   '<div class="rows">'+KIOSKS.filter(k=>!k.online).concat(KIOSKS.filter(k=>k.online).slice(0,2)).slice(0,3).map(k=>'<div class="row"><span class="ic '+(k.online?'g':'r')+'" style="width:36px;height:36px">'+ic('kiosk')+'</span><div class="row-t"><b>'+k.name+'</b><small>'+city(k.city)+' · '+ago(k.sync)+'</small></div>'+(k.online?'<span class="chip g dot">'+tr('Online','متصل')+'</span>':'<button class="btn btn-o btn-sm" type="button" data-act="restartKiosk" data-id="'+k.id+'">'+ic('refresh')+tr('Restart','إعادة تشغيل')+'</button>')+'</div>').join('')+'</div></div></section>':'')+
  (on('insights')?'<section class="card s4"><div class="card-h"><h3>'+tr('Smart insights','رؤى ذكية')+'</h3><span class="ai-badge">✦ '+tr('Auto','تلقائي')+'</span></div><div class="card-b"><div class="ins">'+insights(cur,prev)+'</div></div></section>':'')+
  /* recent + attention */
  (on('recent')?'<section class="card '+(on('attention')?'s8':'s12')+'"><div class="card-h"><h3>'+tr('Recent donations','أحدث التبرعات')+'</h3><a class="link" href="#donations">'+tr('View all','عرض الكل')+ic('arrow')+'</a></div><div class="card-b" style="padding-inline:0;padding-bottom:6px">'+
   table('recent',{rows:()=>DONATIONS.slice(0,6),text:()=>'',noPager:true,per:6,cols:[{k:'id',h:()=>'ID',r:d=>'<span class="id">'+d.id+'</span>'},{k:'t',h:()=>tr('Time','الوقت'),r:d=>dfmt(d.date,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})},{k:'c',h:()=>tr('Campaign','الحملة'),r:d=>cname(d.camp)},{k:'ch',h:()=>tr('Channel','القناة'),r:d=>chChip(d.ch)},{k:'p',h:()=>tr('Payment','الدفع'),r:d=>payName(d.pay)},{k:'a',h:()=>tr('Amount','المبلغ'),r:d=>aed(d.amt),cls:'num'},{k:'rc',h:()=>tr('Receipt','الإيصال'),r:d=>rcChip(d.rc)}]})+'</div></section>':'')+
  (on('attention')?'<section class="card '+(on('recent')?'s4':'s12')+'"><div class="card-h"><h3>'+tr('Needs attention','يحتاج إلى متابعة')+'</h3></div><div class="card-b">'+
   (!KIOSKS.length?'':att('alert','r',tr((KIOSKS.length-online)+' kiosk offline',(KIOSKS.length-online)+' كشك غير متصل'),KIOSKS.filter(k=>!k.online).map(k=>k.name).join(', ')||tr('All kiosks online','كل الأكشاك متصلة'),'#kiosks/offline'))+
   (SRV?att('file','a',tr(PAGES.filter(p=>!p.pub).length+' draft pages',PAGES.filter(p=>!p.pub).length+' صفحات مسودة'),tr('Not published on the website yet','غير منشورة على الموقع بعد'),'#website'):att('file','a',tr('2 content approvals','موافقتان على المحتوى'),tr('Campaign banners ready for review','لافتات الحملات جاهزة للمراجعة'),'#website'))+
   (ending?att('clock','b',tr('1 campaign ending soon','حملة واحدة تنتهي قريبًا'),tr(ending.en+' ends in '+ending.end+' days',ending.ar+' تنتهي خلال '+ending.end+' أيام'),'#campaigns'):'')+
   att('receipt','v',tr(pend+' receipts not issued',pend+' إيصالات لم تصدر'),tr('Pending or failed','قيد الانتظار أو فشلت'),'#receipts')+'</div></section>':'')+
  '</div>'};
const periodLabel=()=>({7:tr('last 7 days','آخر 7 أيام'),30:tr('last 30 days','آخر 30 يومًا'),90:tr('last 90 days','آخر 90 يومًا')})[F.period];
const feedItem=(d,isNew)=>{const dn=donor(d.donor);return '<div class="feed-i'+(isNew?' new':'')+'"><span class="db-av'+(d.ch==='kiosk'?' k':'')+'">'+(dn?esc(dn.name[0]):'★')+'</span><div class="row-t"><b>'+(dn?esc(dn.name.split(' ')[0]):tr('Anonymous','متبرع مجهول'))+' · '+aed(d.amt)+'</b><small>'+cname(d.camp)+' · '+(d.kiosk?kiosk(d.kiosk).name:tr('Website','الموقع'))+'</small></div><small class="muted">'+(isNew?tr('now','الآن'):d.date.toLocaleTimeString(LANG==='ar'?'ar-AE-u-nu-latn':'en-GB',{hour:'2-digit',minute:'2-digit'}))+'</small></div>'};
/* two concentric rings: website outer, kiosk inner */
const rings=list=>{const s=ch=>list.filter(d=>d.ch===ch).reduce((a,d)=>a+d.amt,0),w=s('web'),k=s('kiosk'),t=w+k||1,wn=list.filter(d=>d.ch==='web').length,kn=list.length-wn;
  return '<div class="ring"><div class="ring-w"><svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="84" stroke="var(--line2)" stroke-width="16"/><circle cx="100" cy="100" r="84" stroke="#2f6fed" stroke-width="16" pathLength="100" stroke-dasharray="0 100" data-to="'+(w/t*100).toFixed(1)+'"/><circle cx="100" cy="100" r="62" stroke="var(--line2)" stroke-width="16"/><circle cx="100" cy="100" r="62" stroke="#00a27a" stroke-width="16" pathLength="100" stroke-dasharray="0 100" data-to="'+(k/t*100).toFixed(1)+'"/></svg><div class="donut-c"><small>'+CUR+'</small><b>'+kfmt(w+k)+'</b><small>'+nf(list.length)+' '+tr('gifts','تبرع')+'</small></div></div>'+
  '<div class="ring-l"><div><i style="background:#2f6fed"></i><b>'+tr('Website','الموقع')+'</b><em>'+Math.round(w/t*100)+'%</em><small>'+aed(w)+' · '+nf(wn)+' '+tr('gifts','تبرع')+'</small></div><div><i style="background:#00a27a"></i><b>'+tr('Kiosks','الأكشاك')+'</b><em>'+Math.round(k/t*100)+'%</em><small>'+aed(k)+' · '+nf(kn)+' '+tr('gifts','تبرع')+'</small></div></div></div>'};
/* weekday × hour heatmap (08:00–21:00) */
const DAYS=[['Sun','أحد'],['Mon','إثن'],['Tue','ثلا'],['Wed','أرب'],['Thu','خمي'],['Fri','جمع'],['Sat','سبت']],DAYF=[['Sunday','الأحد'],['Monday','الإثنين'],['Tuesday','الثلاثاء'],['Wednesday','الأربعاء'],['Thursday','الخميس'],['Friday','الجمعة'],['Saturday','السبت']];
let HEATPEAK='';
const heatmap=list=>{const H0=8,H1=21,m={};let mx=1,peak=null;list.forEach(d=>{const k=d.date.getDay()+'-'+d.date.getHours();m[k]=(m[k]||0)+d.amt;if(m[k]>mx){mx=m[k];peak=k}});
  const cols=H1-H0+1;let g='<div class="heat" style="grid-template-columns:34px repeat('+cols+',minmax(0,1fr))"><b></b>';
  for(let h=H0;h<=H1;h++)g+='<em>'+(h%12||12)+(h<12?'a':'p')+'</em>';
  [0,1,2,3,4,5,6].forEach(dw=>{g+='<b>'+tr(DAYS[dw][0],DAYS[dw][1])+'</b>';for(let h=H0;h<=H1;h++){const v=m[dw+'-'+h]||0,a=v/mx;g+='<span'+(v?' data-v':'')+' style="background:'+(v?'rgba(0,162,81,'+(.12+a*.88).toFixed(2)+')':'var(--line2)')+'" title="'+tr(DAYS[dw][0],DAYS[dw][1])+' '+(h%12||12)+(h<12?' AM':' PM')+' — '+aed(v)+'"></span>'}});
  if(peak){const [dw,h]=peak.split('-').map(Number);HEATPEAK=tr('Busiest: '+DAYS[dw][0]+' '+(h%12||12)+(h<12?' AM':' PM'),'الأكثر نشاطًا: '+DAYS[dw][1]+' '+(h%12||12)+(h<12?' ص':' م'))}
  return g+'</div><div class="heat-l">'+tr('Less','أقل')+[.12,.35,.6,.85,1].map(a=>'<i style="background:rgba(0,162,81,'+a+')"></i>').join('')+tr('More','أكثر')+'</div>'};
/* rule-based insights from the data */
const insights=(cur,prev)=>{const sum=a=>a.reduce((s,d)=>s+d.amt,0),out=[];
  const byDay=[0,0,0,0,0,0,0];cur.forEach(d=>byDay[d.date.getDay()]+=d.amt);const bd=byDay.indexOf(Math.max(...byDay));
  out.push(['cal','b',tr('<b>'+DAYF[bd][0]+'s</b> bring the most — '+Math.round(byDay[bd]/(sum(cur)||1)*100)+'% of donations. Schedule campaign pushes for '+DAYF[bd][0]+' mornings.','<b>يوم '+DAYF[bd][1]+'</b> هو الأعلى تبرعًا — '+Math.round(byDay[bd]/(sum(cur)||1)*100)+'% من التبرعات. جدول الحملات صباح '+DAYF[bd][1]+'.')]);
  const bc={};cur.forEach(d=>bc[d.camp]=(bc[d.camp]||0)+d.amt);const top=Object.entries(bc).sort((a,b)=>b[1]-a[1])[0];
  if(top){const pc={};prev.forEach(d=>pc[d.camp]=(pc[d.camp]||0)+d.amt);const g=pc[top[0]]?(top[1]-pc[top[0]])/pc[top[0]]*100:0;out.push(['mega','g',tr('<b>'+camp(top[0]).en+'</b> leads with '+aed(top[1])+(g?' ('+(g>0?'+':'')+g.toFixed(0)+'% vs before)':'')+'.','<b>'+camp(top[0]).ar+'</b> في الصدارة بمبلغ '+aed(top[1])+(g?' ('+(g>0?'+':'')+g.toFixed(0)+'% مقارنة بالسابق)':'')+'.')])}
  const ks=sum(cur.filter(d=>d.ch==='kiosk'))/(sum(cur)||1)*100,pks=sum(prev.filter(d=>d.ch==='kiosk'))/(sum(prev)||1)*100;
  out.push(['kiosk','v',tr('Kiosks bring <b>'+ks.toFixed(0)+'%</b> of donations ('+(ks>=pks?'up':'down')+' '+Math.abs(ks-pks).toFixed(1)+' pts). '+(KIOSKS.some(k=>!k.online)?'Restoring the offline kiosk protects this share.':''),'الأكشاك تجلب <b>'+ks.toFixed(0)+'%</b> من التبرعات ('+(ks>=pks?'ارتفاع':'انخفاض')+' '+Math.abs(ks-pks).toFixed(1)+' نقطة).')]);
  const big=cur.filter(d=>d.amt>=1000).length;out.push(['heart','gold',tr('<b>'+big+' major gifts</b> (AED 1,000+) this period — consider a personal thank-you call.','<b>'+big+' تبرعات كبيرة</b> (1,000 درهم فأكثر) في هذه الفترة — فكّر في اتصال شكر شخصي.')]);
  return out.map(i=>'<div><span class="ic '+i[1]+'">'+ic(i[0])+'</span><p>'+i[2]+'</p></div>').join('')};

/* trend chart v2: animated gradient lines, previous-period ghost, 7-day forecast, crosshair */
const drawTrend=()=>{const host=$('#trend');if(!host)return;const days=+F.period,cur=filtered(),prev=filtered(1),val=trendMetric==='amt'?d=>d.amt:()=>1;
  const buckets=[],labels=[];
  if(trendMode==='day'){for(let i=days-1;i>=0;i--){const d=new Date(today.getTime()-i*DAY);labels.push(dfmt(d));buckets.push(i)}}
  else{for(let i=Math.ceil(days/7)-1;i>=0;i--){labels.push(dfmt(new Date(today.getTime()-i*7*DAY-6*DAY)));buckets.push(i)}}
  const unit=trendMode==='day'?DAY:7*DAY,base=today.getTime()+DAY/2;
  const ser=(list,ch,shift=0)=>buckets.map(b=>list.filter(d=>d.ch===ch&&Math.floor((base-shift-d.date.getTime())/unit)===b).reduce((s,d)=>s+val(d),0));
  const S=[{k:'web',name:tr('Website','الموقع'),c:'#2f6fed',c2:'#7c5cdb',data:ser(cur,'web')},{k:'kiosk',name:tr('Kiosks','الأكشاك'),c:'#00a27a',c2:'#3fd18b',data:ser(cur,'kiosk')}];
  const shift=days*DAY;S.forEach(s=>s.prev=ser(prev,s.k,shift));
  const FC=trendShow.fc&&trendMode==='day'?7:0;
  S.forEach(s=>{const n=Math.min(14,s.data.length),ys=s.data.slice(-n),xm=(n-1)/2,ym=ys.reduce((a,b)=>a+b,0)/n;let num=0,den=0;ys.forEach((y,i)=>{num+=(i-xm)*(y-ym);den+=(i-xm)**2});const sl=den?num/den:0;s.fc=Array.from({length:FC},(_,i)=>Math.max(0,ym+sl*(n-1-xm+i+1)));s.sd=Math.sqrt(ys.reduce((a,y)=>a+(y-ym)**2,0)/n)});
  const allLabels=labels.concat(Array.from({length:FC},(_,i)=>dfmt(new Date(today.getTime()+(i+1)*DAY))));
  const vis=S.filter(s=>trendShow[s.k]);
  const keys=[['web','#2f6fed',tr('Website','الموقع')],['kiosk','#00a27a',tr('Kiosks','الأكشاك')],['prev','var(--muted)',tr('Previous period','الفترة السابقة'),1],['fc','var(--muted)',tr('Forecast','التوقع'),1]];
  $('#trend-keys').innerHTML=keys.filter(k=>k[0]!=='fc'||trendMode==='day').map(k=>'<button type="button" class="chip-t'+(k[3]?' dash':'')+'" data-tk="'+k[0]+'" aria-pressed="'+!!trendShow[k[0]]+'"'+(k[3]?' style="color:'+k[1]+'"':'')+'><i style="background:'+k[1]+'"></i><span style="color:var(--ink2)">'+k[2]+'</span></button>').join('');
  const tot=vis.reduce((a,s)=>a+s.data.reduce((x,y)=>x+y,0),0);$('#trend-sub').textContent=(trendMetric==='amt'?aed(tot):nf(tot)+' '+tr('gifts','تبرع'))+' · '+periodLabel();
  const W=Math.max(300,Math.round(host.clientWidth||720)),H=W<520?240:290,L=46,R=14,T=16,B=30,N=allLabels.length;
  const vals=vis.flatMap(s=>s.data.concat(trendShow.prev?s.prev:[],s.fc.map(v=>v+s.sd*.6)));
  const max=Math.max(trendMetric==='amt'?100:3,...vals),step=Math.pow(10,Math.floor(Math.log10(max/4))),nice=Math.ceil(max/4/step)*step*4;
  const x=i=>L+(N<2?0:i*(W-L-R)/(N-1)),y=v=>T+(H-T-B)*(1-Math.min(v,nice)/nice),fmtY=v=>trendMetric==='amt'?kfmt(v):nf(v);
  let g='';for(let k=0;k<=4;k++){const v=nice*k/4;g+='<line class="gl" x1="'+L+'" x2="'+(W-R)+'" y1="'+y(v)+'" y2="'+y(v)+'"/><text class="ax" x="'+(L-8)+'" y="'+(y(v)+4)+'" text-anchor="end">'+fmtY(v)+'</text>'}
  const every=Math.ceil(N/Math.max(3,Math.floor(W/95)));allLabels.forEach((l,i)=>{if(i%every===0)g+='<text class="ax" x="'+x(i)+'" y="'+(H-8)+'" text-anchor="middle">'+l+'</text>'});
  let defs='<defs>',s='';
  vis.forEach((se,k)=>{defs+='<linearGradient id="tl'+k+'" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="'+se.c+'"/><stop offset="1" stop-color="'+se.c2+'"/></linearGradient><linearGradient id="ta'+k+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+se.c+'" stop-opacity=".22"/><stop offset="1" stop-color="'+se.c+'" stop-opacity="0"/></linearGradient><filter id="tg'+k+'" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="4" result="b"/><feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .35 0"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
    const n=se.data.length,pts=se.data.map((v,i)=>[x(i),y(v)]),d=smooth(pts);
    if(trendShow.prev)s+='<path class="prev" d="'+smooth(se.prev.map((v,i)=>[x(i),y(v)]))+'" stroke="'+se.c+'"/>';
    s+='<path class="area" d="'+d+' L'+x(n-1)+','+y(0)+' L'+x(0)+','+y(0)+'Z" fill="url(#ta'+k+')"/><path class="ln draw" d="'+d+'" stroke="url(#tl'+k+')" filter="url(#tg'+k+')" pathLength="1000" style="--len:1000"/>';
    if(FC){const fp=[[x(n-1),y(se.data[n-1])]].concat(se.fc.map((v,i)=>[x(n+i),y(v)])),up=se.fc.map((v,i)=>[x(n+i),y(v+se.sd*.6)]),dn=se.fc.map((v,i)=>[x(n+i),y(Math.max(0,v-se.sd*.6))]).reverse();
      s+='<path class="fc-band" d="M'+x(n-1)+','+y(se.data[n-1])+' '+up.map(p=>'L'+p.join(',')).join(' ')+' '+dn.map(p=>'L'+p.join(',')).join(' ')+'Z" fill="'+se.c+'"/><path class="fc" d="'+smooth(fp)+'" stroke="'+se.c+'"/>'}
    s+='<circle class="dot" cx="'+x(n-1)+'" cy="'+y(se.data[n-1])+'" r="5" fill="'+se.c+'"/>'});
  if(FC)s+='<line class="cur" x1="'+x(labels.length-1)+'" x2="'+x(labels.length-1)+'" y1="'+T+'" y2="'+(H-B)+'"/><text class="today" x="'+(x(labels.length-1)+6)+'" y="'+(T+10)+'">'+tr('TODAY','اليوم')+'</text>';
  host.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+tr('Donation trend chart','مخطط اتجاه التبرعات')+'">'+defs+'</defs>'+g+s+'<line class="cur" id="cur" y1="'+T+'" y2="'+(H-B)+'" visibility="hidden"/><g id="hdots"></g><rect x="'+L+'" y="0" width="'+(W-L-R)+'" height="'+H+'" fill="transparent" style="cursor:crosshair"/></svg><div class="tip" hidden></div>';
  if(!vis.length){host.insertAdjacentHTML('beforeend','<div class="empty" style="position:absolute;inset:0;display:grid;place-content:center">'+tr('Turn on a channel to see the chart.','فعّل قناة لعرض المخطط.')+'</div>');return}
  const svg=host.querySelector('svg'),tip=host.querySelector('.tip'),cur2=svg.querySelector('#cur'),hd=svg.querySelector('#hdots');
  const move=ev=>{const r=svg.getBoundingClientRect(),px=(ev.clientX-r.left)/r.width*W;const i=Math.max(0,Math.min(N-1,Math.round((px-L)/((W-L-R)/Math.max(1,N-1)))));const isF=i>=labels.length;
    cur2.setAttribute('x1',x(i));cur2.setAttribute('x2',x(i));cur2.setAttribute('visibility','visible');
    hd.innerHTML=vis.map(se=>{const v=isF?se.fc[i-labels.length]:se.data[i];return '<circle cx="'+x(i)+'" cy="'+y(v)+'" r="5.5" fill="'+se.c+'" stroke="var(--card)" stroke-width="3"/>'}).join('');
    tip.hidden=false;tip.innerHTML='<b>'+allLabels[i]+(isF?' · '+tr('forecast','توقع'):'')+'</b>'+vis.map(se=>{const v=isF?se.fc[i-labels.length]:se.data[i],pv=!isF&&trendShow.prev?se.prev[i]:null;return '<div><i style="background:'+se.c+'"></i>'+se.name+': '+(trendMetric==='amt'?aed(v):nf(v))+(pv!=null?' <span style="opacity:.6">('+tr('prev','سابق')+' '+(trendMetric==='amt'?kfmt(pv):nf(pv))+')</span>':'')+'</div>'}).join('');
    const tx=x(i)/W*100;tip.style.left=Math.max(14,Math.min(86,tx))+'%';tip.style.top=(Math.min(...vis.map(se=>y(isF?se.fc[i-labels.length]:se.data[i])))/H*100)+'%'};
  svg.addEventListener('pointermove',move);svg.addEventListener('pointerdown',move);svg.addEventListener('pointerleave',()=>{tip.hidden=true;cur2.setAttribute('visibility','hidden');hd.innerHTML=''})};

/* after the overview is in the page: animate numbers + rings, draw the chart, start the live feed */
const afterOverview=()=>{const v=$('#db-view');countUp(v);drawTrend();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{$$('[data-to]',v).forEach(c=>c.setAttribute('stroke-dasharray',c.dataset.to+' 100'))}));
  const hs=$('#heat-sub');if(hs)hs.textContent=HEATPEAK;startLive()};
const startLive=()=>{clearTimeout(liveT);if(!LIVE||route().view!=='overview')return;
  if(SRV){liveT=setTimeout(()=>route().view==='overview'&&reload(true).catch(()=>{}).finally(startLive),30000);return}
  liveT=setTimeout(()=>{if(route().view!=='overview')return;const kioskGift=rnd()<.4,k=kioskGift?pick(KIOSKS.filter(x=>x.online)):null,c=pick(CAMPAIGNS.filter(x=>x.status==='active'&&(!kioskGift||x.ch.includes('kiosk')))),dn=kioskGift&&rnd()<.6?null:pick(DONORS);
    const d={id:'#D'+String(DONATIONS.length+1001).padStart(6,'0'),date:new Date(),camp:c.id,ch:kioskGift?'kiosk':'web',amt:pick(AMTS),pay:kioskGift?pick(['Card','Apple Pay','Cash']):pick(['Card','Apple Pay','Google Pay']),kiosk:k?k.id:null,city:k?k.city:(dn?dn.city:3),donor:dn?dn.id:null,rc:'issued'};
    DONATIONS.unshift(d);const f=$('#feed');if(f){f.insertAdjacentHTML('afterbegin',feedItem(d,true));while(f.children.length>8)f.lastElementChild.remove()}
    const ht=$('#hero-total');if(ht){const old=+ht.dataset.count,nv=old+d.amt;ht.dataset.from=old;ht.dataset.count=nv;countUp(ht.parentElement);ht.dataset.from=nv}
    const tx=$('#hero-tx');if(tx)tx.textContent=nf(+tx.textContent.replace(/,/g,'')+1);startLive()},3500+rnd()*3000)};

/* command palette (Ctrl/⌘ K) */
const cmdk=$('#db-cmdk'),cq=$('#db-cmdk-q'),cl=$('#db-cmdk-l');let cItems=[],cOn=0;
const cmdItems=()=>[].concat(NAV.filter(n=>n[0]!=='_').map(n=>({g:tr('Pages','الصفحات'),i:n[1],t:tr(n[2],n[3]),go:'#'+n[0]})),
  [['plus',tr('Create campaign','إنشاء حملة'),()=>ACT.newCampaign()],['card',tr('Record donation','تسجيل تبرع'),()=>ACT.addDonation()],['users',tr('Invite user','دعوة مستخدم'),()=>ACT.inviteUser()],['download',tr('Export donations CSV','تصدير التبرعات CSV'),()=>ACT.exportCsv()],['refresh',tr('Sync all kiosks','مزامنة كل الأكشاك'),()=>ACT.syncAll()],['eye',tr('Toggle dark mode','تبديل الوضع الداكن'),()=>toggleTheme()],['globe',tr('Switch to Arabic','التبديل إلى الإنجليزية').replace('الإنجليزية','الإنجليزية'),()=>setLang(LANG==='ar'?'en':'ar')]].map(a=>({g:tr('Actions','إجراءات'),i:a[0],t:a[1],run:a[2]})),
  CAMPAIGNS.map(c=>({g:tr('Campaigns','الحملات'),i:'mega',t:tr(c.en,c.ar),go:'#campaigns'})),KIOSKS.map(k=>({g:tr('Kiosks','الأكشاك'),i:'kiosk',t:k.name+' · '+city(k.city),go:k.online?'#kiosks':'#kiosks/offline'})));
const drawCmd=()=>{const q=cq.value.trim().toLowerCase();cItems=cmdItems().filter(x=>!q||x.t.toLowerCase().includes(q)).slice(0,40);if(q&&!cItems.length)cItems=[{g:tr('Search','البحث'),i:'eye',t:tr('Search everything for “'+cq.value+'”','البحث عن “'+cq.value+'”'),go:'#search/'+encodeURIComponent(cq.value)}];
  cOn=Math.min(cOn,Math.max(0,cItems.length-1));let lastG='';cl.innerHTML=cItems.map((x,i)=>{const h=x.g!==lastG?'<div class="cmdk-g">'+x.g+'</div>':'';lastG=x.g;return h+'<button type="button" role="option" class="cmdk-i'+(i===cOn?' on':'')+'" data-ci="'+i+'" aria-selected="'+(i===cOn)+'">'+ic(x.i)+'<span>'+esc(x.t)+'</span>'+(i===cOn?'<kbd>↵</kbd>':'')+'</button>'}).join('');const a=cl.querySelector('.on');a&&a.scrollIntoView({block:'nearest'})};
const openCmd=()=>{cq.value='';cOn=0;cq.placeholder=tr('Jump to a page, campaign, kiosk or action…','انتقل إلى صفحة أو حملة أو كشك أو إجراء…');drawCmd();cmdk.showModal?cmdk.showModal():cmdk.setAttribute('open','');cq.focus()};
const runCmd=i=>{const x=cItems[i];if(!x)return;cmdk.close?cmdk.close():cmdk.removeAttribute('open');if(x.run)x.run();else location.hash=x.go};
cq.addEventListener('input',()=>{cOn=0;drawCmd()});
cq.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();cOn=(cOn+(e.key==='ArrowDown'?1:-1)+cItems.length)%Math.max(1,cItems.length);drawCmd()}else if(e.key==='Enter'){e.preventDefault();runCmd(cOn)}});
cl.addEventListener('click',e=>{const b=e.target.closest('[data-ci]');if(b)runCmd(+b.dataset.ci)});
cl.addEventListener('mousemove',e=>{const b=e.target.closest('[data-ci]');if(b&&+b.dataset.ci!==cOn){cOn=+b.dataset.ci;drawCmd()}});
cmdk.addEventListener('click',e=>{if(e.target===cmdk)cmdk.close()});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCmd()}});
$('#db-kbd').addEventListener('click',openCmd);$('#db-sbtn').addEventListener('click',openCmd);
if(/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent))$('#db-kbd').textContent='⌘K';

/* dark mode */
const toggleTheme=()=>{const d=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=d?'dark':'light';$('#db-theme').setAttribute('aria-pressed',String(d));store.set('theme',d?'dark':'light');if(route().view==='overview')drawTrend()};
$('#db-theme').addEventListener('click',toggleTheme);$('#db-theme').setAttribute('aria-pressed',String(document.documentElement.dataset.theme==='dark'));


V.website=()=>{if(!HOME)loadHome();const act={slides:HOME?.can_edit?'<button class="btn btn-p" type="button" data-act="slideEdit">'+ic('plus')+tr('New slide','شريحة جديدة')+'</button>':'',cats:HOME?.can_edit?'<button class="btn btn-p" type="button" data-act="catEdit">'+ic('plus')+tr('New category','فئة جديدة')+'</button>':'',media:HOME?.can_edit?(mediaTab==='news'?'<button class="btn btn-p" type="button" data-act="newsEdit">'+ic('plus')+tr('New story','خبر جديد')+'</button>':'<button class="btn btn-p" type="button" data-act="mcEdit" data-kind="'+mediaTab+'">'+ic('plus')+tr(MC[mediaTab].add[0],MC[mediaTab].add[1])+'</button>'):'',popup:HOME?.can_edit&&HOME.popup?'<button class="btn btn-p" type="button" data-act="popupEdit">'+ic('edit')+tr('Edit popup','تعديل النافذة')+'</button>':'',pages:'<button class="btn btn-p" type="button" data-act="newPage">'+ic('plus')+tr('New page','صفحة جديدة')+'</button>'}[homeTab];
  return head(tr('Website','الموقع'),tr('Home banners, home categories, the Media Center and pages on alihsan.ae.','بانرات وفئات الصفحة الرئيسية والمركز الإعلامي والصفحات على الموقع.'),'<a class="btn btn-o" href="/" target="_blank" rel="noopener">'+ic('eye')+tr('Open website','فتح الموقع')+'</a>'+(act||''))+
  '<div class="g-kpi">'+kpi('file','g',tr('Published pages','الصفحات المنشورة'),String(PAGES.filter(p=>p.pub).length),'','#website')+kpi('edit','a',tr('Drafts','المسودات'),String(PAGES.filter(p=>!p.pub).length),'','#website')+kpi('eye','b',(SRV?tr('Visitors (30 days)','الزوار (30 يومًا)'):tr('Visits (30 days)','الزيارات (30 يومًا)')),(SRV?kfmt(SRV.web.visitors):'48.2K'),(SRV?delta(SRV.web.visitors,SRV.web.prevVisitors):'<span class="trend">'+ic('up')+'+9%</span>'),'#reports')+kpi('heart','v',tr('Conversion','معدل التحويل'),(SRV?(SRV.web.visitors?(SRV.web.orders/SRV.web.visitors*100).toFixed(1):'0')+'%':'3.4%'),(SRV?'':'<span class="trend">'+ic('up')+'+0.4%</span>'),'#reports')+'</div>'+
  '<div class="tabs" role="tablist">'+[['slides',tr('Hero slides','شرائح البانر'),HOME?.slides?.length],['cats',tr('Home categories','فئات الرئيسية'),HOME?.categories?.filter(c=>c.shown).length],['media',tr('Media Center','المركز الإعلامي'),null],['popup',tr('Home popup','النافذة المنبثقة'),null],['pages',tr('Pages','الصفحات'),PAGES.length]].map(t=>'<button type="button" role="tab" data-htab="'+t[0]+'" aria-selected="'+(homeTab===t[0])+'" class="'+(homeTab===t[0]?'on':'')+'">'+t[1]+(t[2]!=null?' ('+t[2]+')':'')+'</button>').join('')+'</div>'+
  ({slides:slidesView,cats:catsView,media:mediaView,popup:popupView,pages:pagesView}[homeTab]||slidesView)()};

let campTab='all';
V.campaigns=()=>{const list=CAMPAIGNS.filter(c=>campTab==='all'||c.status===campTab);
  return head(tr('Campaigns','الحملات'),tr('Create once and publish to the website and kiosks.','أنشئ مرة واحدة وانشر على الموقع والأكشاك.'),'<button class="btn btn-p" type="button" data-act="newCampaign">'+ic('plus')+tr('Create campaign','إنشاء حملة')+'</button>')+
  '<div class="tabs" role="tablist">'+[['all',tr('All','الكل')],['active',tr('Active','نشطة')],['draft',tr('Drafts','مسودات')],['ended',tr('Ended','منتهية')]].map(t=>'<button type="button" role="tab" data-ctab="'+t[0]+'" aria-selected="'+(campTab===t[0])+'" class="'+(campTab===t[0]?'on':'')+'">'+t[1]+' ('+CAMPAIGNS.filter(c=>t[0]==='all'||c.status===t[0]).length+')</button>').join('')+'</div>'+
  (list.length?'<div class="cards">'+list.map(c=>{const r=raised(c.id),p=pctOf(r,c.goal);return '<article class="card cc"><img src="'+c.img+'" alt="" loading="lazy"><div class="card-b"><div style="display:flex;gap:6px;flex-wrap:wrap">'+({active:'<span class="chip g dot">'+tr('Active','نشطة')+'</span>',draft:'<span class="chip a dot">'+tr('Draft','مسودة')+'</span>',ended:'<span class="chip dot">'+tr('Ended','منتهية')+'</span>',paused:'<span class="chip r dot">'+tr('Paused','متوقفة')+'</span>'})[c.status]+(c.ch.includes('web')?'<span class="chip b">'+tr('Website','الموقع')+'</span>':'')+(c.ch.includes('kiosk')?'<span class="chip g">'+tr('Kiosks','الأكشاك')+'</span>':'')+'</div><h4>'+tr(c.en,c.ar)+'</h4><small class="muted">'+tr(c.den,c.dar)+'</small><div class="track"><i style="width:'+p+'%"></i></div><div class="meta"><span><b>'+aed(r)+'</b> '+tr('raised','تم جمعها')+'</span><span>'+(c.goal>0?p+'% '+tr('of','من')+' '+kfmt(c.goal):tr('No goal set','لا يوجد هدف'))+'</span></div><div class="meta"><span>'+ic('clock')+' '+(c.end==null?tr('Ongoing','مستمرة'):c.end>0?tr(c.end+' days left','متبقي '+c.end+' يومًا'):tr('Ended','انتهت'))+'</span></div><div class="cc-f"><button class="btn btn-g btn-sm" type="button" data-act="editCampaign" data-id="'+c.id+'">'+ic('edit')+tr('Edit','تعديل')+'</button>'+(c.status==='active'?'<button class="btn btn-g btn-sm" type="button" data-act="pauseCampaign" data-id="'+c.id+'">'+ic('pause')+tr('Pause','إيقاف')+'</button>':c.status!=='ended'?'<button class="btn btn-o btn-sm" type="button" data-act="activateCampaign" data-id="'+c.id+'">'+ic('play')+tr('Publish','نشر')+'</button>':'')+'</div></div></article>'}).join('')+'</div>':'<div class="card empty"><b>'+tr('No campaigns here yet','لا توجد حملات هنا بعد')+'</b></div>')};

let kioskFilter='all';
V.kiosks=(arg)=>{if(arg)kioskFilter=arg;const list=KIOSKS.filter(k=>kioskFilter==='all'||(kioskFilter==='online')===k.online),todayD=DONATIONS.filter(d=>d.ch==='kiosk'&&d.date.toDateString()===today.toDateString());
  return head(tr('Kiosks','الأكشاك'),tr('Health, sync status and today’s donations per kiosk.','الحالة والمزامنة وتبرعات اليوم لكل كشك.'),'<button class="btn btn-o" type="button" data-act="syncAll">'+ic('refresh')+tr('Sync all','مزامنة الكل')+'</button><button class="btn btn-p" type="button" data-act="assignKiosk">'+ic('kiosk')+tr('Assign content','تعيين المحتوى')+'</button>')+
  '<div class="tabs">'+[['all',tr('All','الكل')],['online',tr('Online','متصل')],['offline',tr('Offline','غير متصل')]].map(t=>'<button type="button" data-ktab="'+t[0]+'" class="'+(kioskFilter===t[0]?'on':'')+'">'+t[1]+' ('+KIOSKS.filter(k=>t[0]==='all'||(t[0]==='online')===k.online).length+')</button>').join('')+'</div>'+
  '<div class="cards">'+list.map(k=>{const kd=todayD.filter(d=>d.kiosk===k.id);return '<article class="card kc'+(k.online?'':' off')+'"><div class="kc-h"><span class="ic '+(k.online?'g':'r')+'">'+ic('kiosk')+'</span><span style="flex:1;min-width:0"><b>'+k.name+'</b><small>'+city(k.city)+' · '+k.spot+'</small></span>'+(k.online?'<span class="chip g dot">'+tr('Online','متصل')+'</span>':'<span class="chip r dot">'+tr('Offline','غير متصل')+'</span>')+'</div><div class="kc-s"><span><b>'+aed(kd.reduce((s,d)=>s+d.amt,0))+'</b>'+tr('Today','اليوم')+'</span><span><b>'+k.paper+'%</b>'+tr('Receipt paper','ورق الإيصالات')+'</span><span><b>'+k.uptime+'%</b>'+tr('Uptime','وقت التشغيل')+'</span></div><div class="cc-f"><small class="muted" style="flex:1">'+k.id+' · '+tr('synced','مزامنة')+' '+ago(k.sync)+'</small><button class="btn btn-g btn-sm" type="button" data-act="restartKiosk" data-id="'+k.id+'">'+ic('refresh')+tr('Restart','إعادة تشغيل')+'</button></div></article>'}).join('')+'</div>'+(KIOSKS.length?'':'<div class="card empty"><b>'+tr('No kiosks connected yet','لا توجد أكشاك متصلة بعد')+'</b>'+tr('Kiosk donations will appear here once kiosks are linked to Odoo.','ستظهر تبرعات الأكشاك هنا بعد ربط الأكشاك بأودو.')+'</div>')};

let donCh='all';
V.donations=()=>head(tr('Donations','التبرعات'),tr('Every gift from the website and kiosks.','كل تبرع من الموقع والأكشاك.'),'<button class="btn btn-g" type="button" data-act="exportCsv">'+ic('download')+tr('Export CSV','تصدير CSV')+'</button><button class="btn btn-p" type="button" data-act="addDonation">'+ic('plus')+tr('Record donation','تسجيل تبرع')+'</button>')+
  '<div class="db-filters">'+searchBox('donations',tr('Search ID, campaign, donor…','ابحث بالرقم أو الحملة أو المتبرع…'))+'<div class="tabs" style="margin:0">'+[['all',tr('All','الكل')],['web',tr('Website','الموقع')],['kiosk',tr('Kiosks','الأكشاك')]].map(t=>'<button type="button" data-dch="'+t[0]+'" class="'+(donCh===t[0]?'on':'')+'">'+t[1]+'</button>').join('')+'</div></div>'+
  '<section class="card">'+table('donations',{rows:()=>DONATIONS.filter(d=>donCh==='all'||d.ch===donCh),text:d=>d.id+' '+camp(d.camp).en+' '+camp(d.camp).ar+' '+(donor(d.donor)?.name||'')+' '+d.pay,sort:'date',cols:[
   {k:'id',h:()=>'ID',v:d=>d.id,r:d=>'<span class="id">'+d.id+'</span>'},{k:'date',h:()=>tr('Date','التاريخ'),v:d=>d.date,r:d=>dfmt(d.date,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})},
   {k:'c',h:()=>tr('Campaign','الحملة'),v:d=>cname(d.camp),r:d=>cname(d.camp)},{k:'dn',h:()=>tr('Donor','المتبرع'),v:d=>donor(d.donor)?.name||'~',r:d=>donor(d.donor)?'<span class="who"><span class="db-av">'+donor(d.donor).name[0]+'</span>'+esc(donor(d.donor).name)+'</span>':'<span class="muted">'+tr('Anonymous','مجهول')+'</span>'},
   {k:'ch',h:()=>tr('Channel','القناة'),v:d=>d.ch,r:d=>chChip(d.ch)},{k:'loc',h:()=>tr('Location','الموقع'),v:d=>d.city,r:d=>d.kiosk?kiosk(d.kiosk).name:city(d.city)},{k:'pay',h:()=>tr('Payment','الدفع'),v:d=>d.pay,r:d=>payName(d.pay)},
   {k:'amt',h:()=>tr('Amount','المبلغ'),v:d=>d.amt,r:d=>aed(d.amt),cls:'num'},{k:'rc',h:()=>tr('Receipt','الإيصال'),v:d=>d.rc,r:d=>rcChip(d.rc)}]})+'</section>';

V.donors=()=>{const stats=id=>{const g=DONATIONS.filter(d=>d.donor===id);return {n:g.length,t:g.reduce((s,d)=>s+d.amt,0),last:g[0]?.date}};
  return head(tr('Donors','المتبرعون'),tr('People who gave through the website or with their phone at a kiosk.','الأشخاص الذين تبرعوا عبر الموقع أو برقم هاتفهم في الكشك.'),'<button class="btn btn-g" type="button" data-act="exportDonors">'+ic('download')+tr('Export','تصدير')+'</button>')+
  '<div class="db-filters">'+searchBox('donors',tr('Search name or phone…','ابحث بالاسم أو الهاتف…'))+'</div><section class="card">'+table('donors',{rows:()=>DONORS.map(d=>Object.assign({},d,stats(d.id))),text:d=>d.name+' '+d.phone+' '+d.id,sort:'t',cols:[
   {k:'name',h:()=>tr('Donor','المتبرع'),v:d=>d.name,r:d=>'<span class="who"><span class="db-av">'+d.name[0]+'</span><span><b>'+esc(d.name)+'</b><br><small class="muted">'+d.id+'</small></span></span>'},{k:'ph',h:()=>tr('Phone','الهاتف'),r:d=>'<span dir="ltr">'+d.phone.replace(/\d{4}$/,'••••')+'</span>'},
   {k:'city',h:()=>tr('City','المدينة'),v:d=>d.city,r:d=>city(d.city)},{k:'n',h:()=>tr('Gifts','التبرعات'),v:d=>d.n,r:d=>nf(d.n)},{k:'t',h:()=>tr('Total given','إجمالي التبرعات'),v:d=>d.t,r:d=>aed(d.t),cls:'num'},
   {k:'last',h:()=>tr('Last gift','آخر تبرع'),v:d=>d.last||0,r:d=>d.last?dfmt(d.last):'—'},{k:'tier',h:()=>tr('Tier','الفئة'),v:d=>d.t,r:d=>d.t>5000?'<span class="chip gold">'+tr('Gold','ذهبي')+'</span>':d.t>1500?'<span class="chip g">'+tr('Regular','منتظم')+'</span>':'<span class="chip">'+tr('New','جديد')+'</span>'}]})+'</section>'};

let rcTab='all';
V.receipts=()=>head(tr('Receipts','الإيصالات'),tr('Tax-ready receipts sent by e-mail or SMS after each gift.','إيصالات ترسل بالبريد أو الرسائل بعد كل تبرع.'),'<button class="btn btn-o" type="button" data-act="retryAll">'+ic('send')+tr('Retry failed','إعادة إرسال الفاشلة')+'</button>')+
  '<div class="db-filters">'+searchBox('receipts',tr('Search receipt or donor…','ابحث بالإيصال أو المتبرع…'))+'<div class="tabs" style="margin:0">'+[['all',tr('All','الكل')],['issued',tr('Issued','صادرة')],['pending',tr('Pending','قيد الانتظار')],['failed',tr('Failed','فاشلة')]].map(t=>'<button type="button" data-rtab="'+t[0]+'" class="'+(rcTab===t[0]?'on':'')+'">'+t[1]+' ('+DONATIONS.filter(d=>d.donor&&(t[0]==='all'||d.rc===t[0])).length+')</button>').join('')+'</div></div>'+
  '<section class="card">'+table('receipts',{rows:()=>DONATIONS.filter(d=>d.donor&&(rcTab==='all'||d.rc===rcTab)),text:d=>d.id+' '+(donor(d.donor)?.name||''),sort:'date',cols:[
   {k:'r',h:()=>tr('Receipt','الإيصال'),v:d=>d.id,r:d=>'<span class="id">R-'+d.id.slice(2)+'</span>'},{k:'date',h:()=>tr('Date','التاريخ'),v:d=>d.date,r:d=>dfmt(d.date)},{k:'dn',h:()=>tr('Donor','المتبرع'),v:d=>donor(d.donor).name,r:d=>esc(donor(d.donor).name)},
   {k:'amt',h:()=>tr('Amount','المبلغ'),v:d=>d.amt,r:d=>aed(d.amt),cls:'num'},{k:'via',h:()=>tr('Sent via','أرسل عبر'),r:d=>d.ch==='kiosk'?tr('SMS','رسالة نصية'):tr('E-mail','البريد'),v:d=>d.ch},{k:'rc',h:()=>tr('Status','الحالة'),v:d=>d.rc,r:d=>rcChip(d.rc)},
   {k:'x',h:()=>'',r:d=>'<button class="btn btn-g btn-sm" type="button" data-act="viewReceipt" data-id="'+d.id+'">'+ic('eye')+tr('View','عرض')+'</button>'+(d.rc!=='issued'?' <button class="btn btn-o btn-sm" type="button" data-act="resend" data-id="'+d.id+'">'+ic('send')+tr('Resend','إعادة إرسال')+'</button>':'')}]})+'</section>';

V.reports=()=>{const cur=filtered(),sum=a=>a.reduce((s,d)=>s+d.amt,0),by=(key,name)=>{const m={};cur.forEach(d=>{const k=key(d);m[k]=(m[k]||0)+d.amt});const arr=Object.entries(m).sort((a,b)=>b[1]-a[1]),mx=arr[0]?.[1]||1;return arr.map(([k,v])=>({n:name(k),v:kfmt(v),p:v/mx*100}))};
  const pays={};cur.forEach(d=>pays[d.pay]=(pays[d.pay]||0)+d.amt);const pc=['#00a27a','#2f6fed','#7c5cdb','#d9b564','#e07a5f'];
  const months=[2,1,0].map(m=>{const d=new Date(today.getFullYear(),today.getMonth()-m,1),e=new Date(today.getFullYear(),today.getMonth()-m+1,1);return {n:dfmt(d,{month:'long'}),t:DONATIONS.filter(x=>x.date>=d&&x.date<e).reduce((s,x)=>s+x.amt,0)}}),mm=Math.max(...months.map(m=>m.t))||1;
  return head(tr('Reports','التقارير'),tr('Where donations come from and where they go.','من أين تأتي التبرعات وإلى أين تذهب.'),'<button class="btn btn-p" type="button" data-act="exportCsv">'+ic('download')+tr('Export CSV','تصدير CSV')+'</button><button class="btn btn-g" type="button" data-act="print">'+ic('print')+tr('Print','طباعة')+'</button>')+filterBar()+
  '<div class="g-kpi">'+kpi('coins','g',tr('Total raised','إجمالي المبالغ'),aed(sum(cur)),'','#donations')+kpi('swap','b',tr('Average gift','متوسط التبرع'),aed(cur.length?sum(cur)/cur.length:0),'','#donations')+kpi('users','v',tr('Unique donors','متبرعون فريدون'),nf(new Set(cur.map(d=>d.donor).filter(Boolean)).size),'','#donors')+kpi('kiosk','a',tr('Kiosk share','حصة الأكشاك'),Math.round(sum(cur.filter(d=>d.ch==='kiosk'))/(sum(cur)||1)*100)+'%','','#kiosks')+'</div>'+
  '<div class="g-1-1"><section class="card"><div class="card-h"><h3>'+tr('By campaign','حسب الحملة')+'</h3></div><div class="card-b">'+bars(by(d=>d.camp,cname))+'</div></section><section class="card"><div class="card-h"><h3>'+tr('By location','حسب الموقع')+'</h3></div><div class="card-b">'+bars(by(d=>d.city,k=>city(+k)),true)+'</div></section></div>'+
  '<div class="g-1-1"><section class="card"><div class="card-h"><h3>'+tr('Payment methods','طرق الدفع')+'</h3></div><div class="card-b">'+donut(Object.entries(pays).sort((a,b)=>b[1]-a[1]).map(([k,v],i)=>({name:payName(k),v,color:pc[i%5]})),kfmt(sum(cur)),CUR)+'</div></section><section class="card"><div class="card-h"><h3>'+tr('Monthly totals','الإجماليات الشهرية')+'</h3></div><div class="card-b">'+bars(months.map(m=>({n:m.n,v:kfmt(m.t),p:m.t/mm*100})))+'</div></section></div>'};

let mediaSel=null;
V.media=()=>head(tr('Media','الوسائط'),tr('Images used across the website, campaigns and kiosk screens.','الصور المستخدمة في الموقع والحملات وشاشات الأكشاك.'),'<label class="btn btn-p">'+ic('upload')+tr('Upload','رفع')+'<input type="file" accept="image/*" multiple hidden data-act="upload"></label>')+
  '<div class="db-filters">'+searchBox('media',tr('Search media…','ابحث في الوسائط…'))+'</div><div class="media" id="media-grid">'+mediaGrid()+'</div>';
const mediaGrid=()=>{const q=(TS.media?.q||'').toLowerCase(),list=MEDIA.filter(m=>(m.title+m.name).toLowerCase().includes(q));return list.length?list.map(m=>{const i=MEDIA.indexOf(m);return '<figure class="mi" tabindex="0" role="button" data-act="mediaOpen" data-i="'+i+'" aria-label="'+esc(m.title)+'"><img src="'+m.src+'" alt="" loading="lazy"><figcaption>'+esc(m.title)+'<small>'+m.size+(m.used!=null?' · '+tr('used in','مستخدمة في')+' '+m.used:'')+'</small></figcaption></figure>'}).join(''):'<div class="card empty" style="grid-column:1/-1"><b>'+tr('No media found','لم يتم العثور على وسائط')+'</b></div>'};

let userTab='all';
V.users=()=>head(tr('Users & Roles','المستخدمون والصلاحيات'),tr('Who can edit campaigns, the website, kiosks and finance.','من يمكنه تعديل الحملات والموقع والأكشاك والمالية.'),'<button class="btn btn-p" type="button" data-act="inviteUser">'+ic('plus')+tr('Invite user','دعوة مستخدم')+'</button>')+
  '<div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr));margin-bottom:16px">'+Object.entries(ROLES).map(([k,r])=>'<button type="button" class="card kpi" data-utab="'+k+'" style="text-align:start;border-color:'+(userTab===k?'var(--g2)':'var(--line)')+'"><span class="ic '+(r[2]||'g')+'">'+ic('shield')+'</span><span><small>'+tr(r[0],r[1])+'</small><b>'+USERS.filter(u=>u.role===k).length+'</b><span class="muted" style="font-size:12px">'+r[3]+' '+tr('permissions','صلاحيات')+'</span></span></button>').join('')+'</div>'+
  '<section class="card"><div class="card-h"><h3>'+(userTab==='all'?tr('All users','كل المستخدمين'):tr(ROLES[userTab][0],ROLES[userTab][1]))+'</h3>'+(userTab!=='all'?'<button class="link" type="button" data-utab="all">'+tr('Show all','عرض الكل')+'</button>':'')+'</div><div class="card-b" style="padding-inline:0">'+
  table('users',{rows:()=>USERS.filter(u=>userTab==='all'||u.role===userTab),text:u=>u.name+u.email,per:10,cols:[{k:'n',h:()=>tr('User','المستخدم'),v:u=>u.name,r:u=>'<span class="who"><span class="db-av">'+esc(u.name[0])+'</span><span><b>'+esc(u.name)+'</b><br><small class="muted">'+esc(u.email)+'</small></span></span>'},
   {k:'r',h:()=>tr('Role','الدور'),v:u=>u.role,r:u=>'<span class="chip '+ROLES[u.role][2]+'">'+tr(ROLES[u.role][0],ROLES[u.role][1])+'</span>'},{k:'s',h:()=>tr('Status','الحالة'),v:u=>u.active,r:u=>u.active?'<span class="chip g dot">'+tr('Active','نشط')+'</span>':'<span class="chip dot">'+tr('Disabled','معطل')+'</span>'},
   {k:'l',h:()=>tr('Last active','آخر نشاط'),v:u=>-u.last,r:u=>u.last>=99999?tr('Never','أبدًا'):ago(u.last*60)},{k:'x',h:()=>'',r:u=>'<button class="btn btn-g btn-sm" type="button" data-act="editUser" data-i="'+USERS.indexOf(u)+'">'+ic('edit')+tr('Edit','تعديل')+'</button>'}]})+'</div></section>';

let setTab='general';
V.settings=()=>{const S=SETTINGS,tg=(k,t,s)=>'<div class="set"><span><b>'+t+'</b><small>'+s+'</small></span><label class="toggle"><input type="checkbox" data-set="'+k+'"'+(S[k]?' checked':'')+' aria-label="'+esc(t)+'"><span></span></label></div>';
  const tabs=[['general',tr('General','عام')],['payments',tr('Payments','المدفوعات')],['receipts',tr('Receipts','الإيصالات')],['alerts',tr('Notifications','الإشعارات')]];
  const body={general:'<div class="fld-2">'+fld('org',tr('Organisation name','اسم الجهة'),'<input id="m-org" data-set="org" value="'+esc(S.org)+'">')+fld('email',tr('Contact e-mail','البريد الإلكتروني'),'<input id="m-email" type="email" data-set="email" value="'+esc(S.email)+'">')+fld('phone',tr('Hotline','الخط الساخن'),'<input id="m-phone" data-set="phone" value="'+esc(S.phone)+'">')+fld('cur',tr('Currency','العملة'),'<select id="m-cur" data-set="cur"><option>'+CUR+'</option></select>')+fld('mgoal',tr('Monthly goal','الهدف الشهري')+' ('+CUR+')','<input id="m-mgoal" type="number" min="0" data-set="monthlyGoal" value="'+(+S.monthlyGoal||0)+'">')+'</div>',
   payments:fld('min',tr('Minimum donation (AED)','الحد الأدنى للتبرع (درهم)'),'<input id="m-min" type="number" min="1" data-set="minAmt" value="'+S.minAmt+'">')+tg('applePay','Apple Pay',tr('Website and kiosks','الموقع والأكشاك'))+tg('gpay','Google Pay',tr('Website','الموقع'))+tg('sms',tr('SMS donations','التبرع بالرسائل'),tr('Short codes per campaign','رموز قصيرة لكل حملة'))+tg('cash',tr('Cash at kiosks','النقد في الأكشاك'),tr('Kiosks with a cash unit','الأكشاك المزودة بوحدة نقد')),
   receipts:tg('autoReceipt',tr('Send receipts automatically','إرسال الإيصالات تلقائيًا'),tr('By e-mail for website gifts, by SMS for kiosks','بالبريد لتبرعات الموقع وبالرسائل للأكشاك'))+tg('receiptAr',tr('Bilingual receipts','إيصالات ثنائية اللغة'),tr('Arabic and English on every receipt','العربية والإنجليزية في كل إيصال')),
   alerts:tg('emailDaily',tr('Daily summary e-mail','ملخص يومي بالبريد'),tr('Totals by channel every morning','الإجماليات حسب القناة كل صباح'))+tg('kioskAlert',tr('Kiosk offline alerts','تنبيهات توقف الأكشاك'),tr('When a kiosk stops syncing for 10 minutes','عند توقف الكشك عن المزامنة 10 دقائق'))+tg('bigGift',tr('Large donation alert','تنبيه التبرعات الكبيرة'),tr('Gifts of AED 5,000 or more','التبرعات بقيمة 5,000 درهم أو أكثر'))};
  return head(tr('Settings','الإعدادات'),tr('Organisation, payments, receipts and alerts.','الجهة والمدفوعات والإيصالات والتنبيهات.'),'<button class="btn btn-p" type="button" data-act="saveSettings">'+ic('check')+tr('Save changes','حفظ التغييرات')+'</button>')+
  '<div class="tabs">'+tabs.map(t=>'<button type="button" data-stab="'+t[0]+'" class="'+(setTab===t[0]?'on':'')+'">'+t[1]+'</button>').join('')+'</div><section class="card" style="max-width:760px"><div class="card-b">'+body[setTab]+'</div></section>'};

V.search=q=>{q=decodeURIComponent(q||'').trim();const l=q.toLowerCase(),has=s=>String(s).toLowerCase().includes(l);
  const cs=CAMPAIGNS.filter(c=>has(c.en)||has(c.ar)),ks=KIOSKS.filter(k=>has(k.name)||has(CITIES[k.city][0])||has(CITIES[k.city][1])),dn=DONORS.filter(d=>has(d.name)||has(d.phone)),ds=DONATIONS.filter(d=>has(d.id)).slice(0,8);
  const grp=(t,items)=>items?'<section class="card" style="margin-bottom:16px"><div class="card-h"><h3>'+t+'</h3></div><div class="card-b"><div class="rows">'+items+'</div></div></section>':'';
  return head(tr('Search','البحث'),q?tr('Results for “'+esc(q)+'”','نتائج البحث عن “'+esc(q)+'”'):tr('Type in the search box above.','اكتب في مربع البحث بالأعلى.'))+
   (!q?'':(cs.length+ks.length+dn.length+ds.length===0?'<div class="card empty"><b>'+tr('Nothing found','لم يتم العثور على شيء')+'</b>'+tr('Try a campaign, kiosk, donor name or donation ID.','جرّب اسم حملة أو كشك أو متبرع أو رقم تبرع.')+'</div>':
   grp(tr('Campaigns','الحملات'),cs.map(c=>'<a class="row" href="#campaigns"><img class="thumb" src="'+c.img+'" alt=""><span class="row-t"><b>'+tr(c.en,c.ar)+'</b><small>'+tr(c.den,c.dar)+'</small></span></a>').join(''))+
   grp(tr('Kiosks','الأكشاك'),ks.map(k=>'<a class="row" href="#kiosks"><span class="ic '+(k.online?'g':'r')+'" style="width:40px;height:40px">'+ic('kiosk')+'</span><span class="row-t"><b>'+k.name+'</b><small>'+city(k.city)+'</small></span></a>').join(''))+
   grp(tr('Donors','المتبرعون'),dn.slice(0,8).map(d=>'<a class="row" href="#donors"><span class="db-av">'+d.name[0]+'</span><span class="row-t"><b>'+esc(d.name)+'</b><small>'+d.id+'</small></span></a>').join(''))+
   grp(tr('Donations','التبرعات'),ds.map(d=>'<a class="row" href="#donations"><span class="id">'+d.id+'</span><span class="row-t"><b>'+cname(d.camp)+'</b><small>'+dfmt(d.date)+'</small></span><b>'+aed(d.amt)+'</b></a>').join(''))))};

/* ---------- router ---------- */
const route=()=>{const h=location.hash.slice(1)||'overview',[view,arg]=h.split('/');return {view:V[view]?view:'overview',arg}};
const render=()=>{const {view,arg}=route(),el=$('#db-view');
  if(view==='donations'&&arg){TS.donations=Object.assign(TS.donations||{},{q:decodeURIComponent(arg),page:1})}
  el.innerHTML=V[view](arg);el.style.animation='none';el.offsetHeight;el.style.animation='';
  Object.keys(TS).forEach(id=>$('#t-'+id)&&drawTable(id));
  if(view==='overview')afterOverview();else clearTimeout(liveT);
  if(view==='website')bindHomeSort();
  markNav();document.title=$('h1',el).textContent+' — Al Ihsan';
  const q=$('#db-q');if(view==='search')q.value=decodeURIComponent(arg||'')};
addEventListener('hashchange',()=>{render();window.scrollTo(0,0);$('#db-view').focus({preventScroll:true})});

/* ---------- actions (event delegation) ---------- */
const view=$('#db-view');
view.addEventListener('change',e=>{const t=e.target;
  if(t.dataset.f){F[t.dataset.f]=t.value;store.set('filters',F);render();return}
  if(t.dataset.act==='slideActive'){homeDo('/alihsan/dashboard/slide/action',{slide_id:+t.dataset.id,action:t.checked?'show':'hide'},t.checked?tr('Slide published','تم نشر الشريحة'):tr('Slide hidden','تم إخفاء الشريحة'));return}
  if(t.dataset.act==='mcActive'){const k=MC[t.dataset.kind];homeDo('/alihsan/dashboard/media_center/action',{kind:t.dataset.kind,rec_id:+t.dataset.id,action:t.checked?'show':'hide'},t.checked?tr(k.one[0]+' published',k.one[1]+' — تم النشر'):tr(k.one[0]+' hidden',k.one[1]+' — تم الإخفاء'));return}
  if(t.dataset.act==='popupActive'){const P=HOME.popup;if(t.checked&&!P.product_id){t.checked=false;ACT.popupEdit();return}
    homeDo('/alihsan/dashboard/popup/save',{vals:{ih_popup_active:t.checked,ih_popup_product_id:P.product_id}},t.checked?tr('Popup switched on','تم تفعيل النافذة'):tr('Popup switched off','تم إيقاف النافذة'));return}
  if(t.dataset.act==='newsActive'){homeDo('/alihsan/dashboard/news/action',{post_id:+t.dataset.id,action:t.checked?'show':'hide'},t.checked?tr('Story published','تم نشر الخبر'):tr('Story hidden','تم إخفاء الخبر'));return}
  if(t.dataset.act==='catShown'){homeDo('/alihsan/dashboard/category/action',{category_id:+t.dataset.id,action:t.checked?'show':'hide'},t.checked?tr('Category added to the home page','تمت إضافة الفئة إلى الرئيسية'):tr('Category removed from the home page','تمت إزالة الفئة من الرئيسية'));return}
  if(SRV&&t.dataset.act==='togglePage'){const p=PAGES[t.dataset.i];rpc('/alihsan/dashboard/page/publish',{page_id:p.id,published:t.checked}).then(()=>{p.pub=t.checked;p.ed=0;toast(t.checked?tr('Page published','تم نشر الصفحة'):tr('Page moved to drafts','تم نقل الصفحة إلى المسودات'));render()}).catch(e=>{t.checked=!t.checked;fail(e)});return}
  if(SRV&&t.dataset.act==='upload'){const n=t.files.length;Promise.all([...t.files].map(f=>readFile(f).then(data=>({name:f.name,data})))).then(files=>rpc('/alihsan/dashboard/media/upload',{files})).then(()=>reload()).then(()=>toast(tr(n+' file(s) uploaded',n+' ملف تم رفعه'))).catch(fail);return}
  if(t.dataset.act==='togglePage'){PAGES[t.dataset.i].pub=t.checked;PAGES[t.dataset.i].ed=0;store.set('pages',PAGES);toast(t.checked?tr('Page published','تم نشر الصفحة'):tr('Page moved to drafts','تم نقل الصفحة إلى المسودات'));render();return}
  if(t.dataset.set!==undefined&&t.type==='checkbox'){SETTINGS[t.dataset.set]=t.checked;return}
  if(t.dataset.act==='upload'){[...t.files].forEach(f=>MEDIA.unshift({src:URL.createObjectURL(f),name:f.name,title:f.name.replace(/\.[^.]+$/,''),size:Math.round(f.size/1024)+' KB',used:0}));toast(tr(t.files.length+' file(s) added (this browser only)',t.files.length+' ملف تمت إضافته (هذا المتصفح فقط)'));render()}});
view.addEventListener('input',e=>{const t=e.target;if(t.dataset.tq){const id=t.dataset.tq;TS[id]=TS[id]||{};TS[id].q=t.value;TS[id].page=1;if(id==='media'){$('#media-grid').innerHTML=mediaGrid()}else if(id==='hcats'){$('#hcats-l').innerHTML=offRows()}else if(id==='hnews'){$('#hnews-l').innerHTML=newsCards()}else if(id.startsWith('mc_')){$('#mc-l').innerHTML=mcCards(id.slice(3))}else drawTable(id)}
  if(t.dataset.set!==undefined&&t.type!=='checkbox')SETTINGS[t.dataset.set]=t.type==='number'?+t.value:t.value});
view.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-lg],.mi,[role=button][data-act]')){e.preventDefault();e.target.click()}});
view.addEventListener('click',e=>{const t=e.target.closest('[data-act],[data-tm],[data-tmet],[data-tk],[data-lg],[data-ctab],[data-ktab],[data-dch],[data-rtab],[data-utab],[data-stab],[data-htab],[data-mtab]');if(!t)return;const d=t.dataset;
  if(d.tmet){trendMetric=d.tmet;$$('[data-tmet]').forEach(b=>b.classList.toggle('on',b===t));drawTrend();return}
  if(d.tk){trendShow[d.tk]=!trendShow[d.tk];store.set('trendShow',trendShow);drawTrend();return}
  if(d.tm){trendMode=d.tm;$$('[data-tm]').forEach(b=>b.classList.toggle('on',b===t));drawTrend();return}
  if(d.ctab){campTab=d.ctab;render();return}if(d.ktab){location.hash=d.ktab==='all'?'#kiosks':'#kiosks/'+d.ktab;kioskFilter=d.ktab;render();return}
  if(d.dch){donCh=d.dch;TS.donations.page=1;render();return}if(d.rtab){rcTab=d.rtab;TS.receipts.page=1;render();return}
  if(d.htab){homeTab=d.htab;store.set('homeTab',homeTab);render();return}if(d.mtab){mediaTab=d.mtab;store.set('mediaTab',mediaTab);render();return}if(d.utab){userTab=d.utab;render();return}if(d.stab){setTab=d.stab;render();return}
  const A=ACT[d.act];if(A&&t.tagName!=='INPUT'){e.preventDefault();A(d,t)}});
const campForm=c=>fld('en',tr('Campaign name (English)','اسم الحملة (إنجليزي)'),'<input id="m-en" name="en" required value="'+esc(c?.en||'')+'">',1)+fld('ar',tr('Campaign name (Arabic)','اسم الحملة (عربي)'),'<input id="m-ar" name="ar" dir="rtl" value="'+esc(c?.ar||'')+'">')+
  '<div class="fld-2">'+fld('goal',tr('Goal (AED)','الهدف (درهم)'),'<input id="m-goal" name="goal" type="number" min="100" required value="'+(c?.goal||50000)+'">',1)+fld('end',tr('Runs for (days)','المدة (أيام)'),'<input id="m-end" name="end" type="number" min="1" value="'+(c&&c.end>0?c.end:30)+'">')+'</div>'+
  fld('img',tr('Image','الصورة'),'<select id="m-img" name="img">'+MEDIA.filter(m=>m.src.startsWith(IMG)).map(m=>'<option value="'+m.src+'"'+(c?.img===m.src?' selected':'')+'>'+esc(m.title)+'</option>').join('')+'</select>')+
  '<div class="fld"><label>'+tr('Publish to','النشر على')+'</label><div style="display:flex;gap:18px"><label style="display:flex;gap:8px;align-items:center;font-weight:600"><input type="checkbox" name="web"'+(!c||c.ch.includes('web')?' checked':'')+'> '+tr('Website','الموقع')+'</label><label style="display:flex;gap:8px;align-items:center;font-weight:600"><input type="checkbox" name="kiosk"'+(!c||c.ch.includes('kiosk')?' checked':'')+'> '+tr('Kiosks','الأكشاك')+'</label></div></div>';
const saveCamps=()=>store.set('campaigns',CAMPAIGNS);
const ACT={
 customize:()=>modal(tr('Customize overview','تخصيص النظرة العامة'),'<p class="muted" style="margin:-6px 0 12px">'+tr('Choose which widgets to show. Saved in this browser.','اختر الأدوات التي تظهر. تُحفظ في هذا المتصفح.')+'</p><div class="cust">'+WIDGETS.map(w=>'<div class="set"><span><b>'+tr(w[1],w[2])+'</b></span><label class="toggle"><input type="checkbox" name="w-'+w[0]+'"'+(on(w[0])?' checked':'')+' aria-label="'+esc(tr(w[1],w[2]))+'"><span></span></label></div>').join('')+'</div>',f=>{HIDDEN=WIDGETS.map(w=>w[0]).filter(w=>!f.get('w-'+w));store.set('hidden',HIDDEN);toast(tr('Overview updated','تم تحديث النظرة العامة'));render()},tr('Apply','تطبيق')),
 toggleLive:()=>{LIVE=!LIVE;store.set('live',LIVE);toast(LIVE?(SRV?tr('Live refresh on','التحديث المباشر يعمل'):tr('Live feed on (simulated donations)','البث المباشر يعمل (تبرعات محاكاة)')):tr('Live feed paused','تم إيقاف البث المباشر'));render()},
 newCampaign:()=>modal(tr('Create campaign','إنشاء حملة'),campForm(null)+fld('st',tr('Status','الحالة'),'<select id="m-st" name="st"><option value="active">'+tr('Publish now','نشر الآن')+'</option><option value="draft">'+tr('Save as draft','حفظ كمسودة')+'</option></select>'),f=>{
   const id='c'+Date.now();CAMPAIGNS.unshift({id,en:f.get('en'),ar:f.get('ar')||f.get('en'),den:tr('New campaign','حملة جديدة'),dar:'حملة جديدة',img:f.get('img'),goal:+f.get('goal'),cat:'General',status:f.get('st'),ch:[f.get('web')&&'web',f.get('kiosk')&&'kiosk'].filter(Boolean),end:+f.get('end')||30});saveCamps();
   toast(tr('Campaign created','تم إنشاء الحملة'));campTab='all';location.hash==='#campaigns'?render():location.hash='#campaigns'},tr('Create','إنشاء')),
 editCampaign:d=>{const c=camp(d.id);modal(tr('Edit campaign','تعديل الحملة'),campForm(c),f=>{c.en=f.get('en');c.ar=f.get('ar')||c.en;c.goal=+f.get('goal');c.end=+f.get('end');c.img=f.get('img');c.ch=[f.get('web')&&'web',f.get('kiosk')&&'kiosk'].filter(Boolean);saveCamps();toast(tr('Campaign saved','تم حفظ الحملة'));render()},null,'<button type="button" class="btn btn-d" id="m-del" style="margin-inline-end:auto">'+ic('trash')+tr('Delete','حذف')+'</button>');
   $('#m-del').onclick=()=>{if(confirm(tr('Delete this campaign?','حذف هذه الحملة؟'))){CAMPAIGNS=CAMPAIGNS.filter(x=>x!==c);saveCamps();closeModal();toast(tr('Campaign deleted','تم حذف الحملة'));render()}}},
 pauseCampaign:d=>{camp(d.id).status='paused';saveCamps();toast(tr('Campaign paused on all channels','تم إيقاف الحملة على كل القنوات'));render()},
 activateCampaign:d=>{camp(d.id).status='active';saveCamps();toast(tr('Campaign published to website and kiosks','تم نشر الحملة على الموقع والأكشاك'));render()},
 restartKiosk:d=>{const k=kiosk(d.id);toast(tr('Restart sent to '+k.name,'تم إرسال إعادة التشغيل إلى '+k.name));setTimeout(()=>{k.online=true;k.sync=0;drawNav();if(route().view==='kiosks'||route().view==='overview')render();toast(tr(k.name+' is back online',k.name+' متصل الآن'))},1800)},
 syncAll:()=>{KIOSKS.forEach(k=>{if(k.online)k.sync=0});toast(tr('All online kiosks synced','تمت مزامنة كل الأكشاك المتصلة'));render()},
 assignKiosk:()=>modal(tr('Assign kiosk content','تعيين محتوى الأكشاك'),fld('kc',tr('Campaign on screen','الحملة المعروضة'),'<select id="m-kc" name="c">'+CAMPAIGNS.filter(c=>c.status==='active'&&c.ch.includes('kiosk')).map(c=>'<option value="'+c.id+'">'+tr(c.en,c.ar)+'</option>').join('')+'</select>')+fld('kl',tr('Kiosks','الأكشاك'),'<select id="m-kl" name="loc"><option value="all">'+tr('All kiosks','كل الأكشاك')+' ('+KIOSKS.length+')</option>'+CITIES.map((c,i)=>'<option value="'+i+'">'+tr(c[0],c[1])+' ('+KIOSKS.filter(k=>k.city===i).length+')</option>').join('')+'</select>'),f=>toast(tr('Content scheduled for the next sync','تمت جدولة المحتوى للمزامنة القادمة')),tr('Assign','تعيين')),
 exportCsv:()=>{const rows=[['ID','Date','Campaign','Channel','Location','Payment','Amount (AED)','Receipt']].concat(filtered().map(d=>[d.id,d.date.toISOString(),camp(d.camp).en,d.ch,d.kiosk?kiosk(d.kiosk).name:CITIES[d.city][0],d.pay,d.amt,d.rc]));download('al-ihsan-donations.csv',rows);toast(tr('CSV downloaded','تم تنزيل الملف'))},
 exportDonors:()=>{download('al-ihsan-donors.csv',[['ID','Name','City']].concat(DONORS.map(d=>[d.id,d.name,CITIES[d.city][0]])));toast(tr('CSV downloaded','تم تنزيل الملف'))},
 addDonation:()=>modal(tr('Record donation','تسجيل تبرع'),fld('c',tr('Campaign','الحملة'),'<select id="m-c" name="c">'+CAMPAIGNS.filter(c=>c.status==='active').map(c=>'<option value="'+c.id+'">'+tr(c.en,c.ar)+'</option>').join('')+'</select>')+'<div class="fld-2">'+fld('a',tr('Amount (AED)','المبلغ (درهم)'),'<input id="m-a" name="a" type="number" min="1" required>',1)+fld('p',tr('Payment','الدفع'),'<select id="m-p" name="p"><option>Card</option><option>Cash</option><option>Apple Pay</option></select>')+'</div>'+fld('dn',tr('Donor (optional)','المتبرع (اختياري)'),'<select id="m-dn" name="dn"><option value="">'+tr('Anonymous','مجهول')+'</option>'+DONORS.slice(0,30).map(d=>'<option value="'+d.id+'">'+esc(d.name)+'</option>').join('')+'</select>'),f=>{
   DONATIONS.unshift({id:'#D'+String(DONATIONS.length+1001).padStart(6,'0'),date:new Date(),camp:f.get('c'),ch:'web',amt:+f.get('a'),pay:f.get('p'),kiosk:null,city:3,donor:f.get('dn')||null,rc:f.get('dn')?'issued':'pending'});toast(tr('Donation recorded','تم تسجيل التبرع'));render()},tr('Record','تسجيل')),
 viewReceipt:d=>{const x=DONATIONS.find(y=>y.id===d.id),dn=donor(x.donor);modal(tr('Receipt','الإيصال')+' R-'+x.id.slice(2),'<div class="card" style="padding:18px;display:grid;gap:10px;box-shadow:none"><img src="'+IMG+'logo.svg" alt="Al Ihsan" style="height:54px;justify-self:start">'+[[tr('Donor','المتبرع'),esc(dn.name)],[tr('Date','التاريخ'),dfmt(x.date,{day:'numeric',month:'long',year:'numeric'})],[tr('Campaign','الحملة'),cname(x.camp)],[tr('Payment','الدفع'),payName(x.pay)],[tr('Amount','المبلغ'),'<b>'+aed(x.amt)+'</b>'],[tr('Status','الحالة'),rcChip(x.rc)]].map(r=>'<div class="set" style="padding:8px 0"><span class="muted">'+r[0]+'</span><span>'+r[1]+'</span></div>').join('')+'</div>',null,null,'<button type="button" class="btn btn-o" data-act="printReceipt" onclick="window.print()">'+ic('print')+tr('Print','طباعة')+'</button>')},
 resend:d=>{const x=DONATIONS.find(y=>y.id===d.id);x.rc='issued';drawNav();toast(tr('Receipt sent again','تمت إعادة إرسال الإيصال'));render()},
 retryAll:()=>{const n=DONATIONS.filter(d=>d.rc==='failed').length;DONATIONS.forEach(d=>{if(d.rc==='failed')d.rc='issued'});drawNav();toast(tr(n+' receipts re-sent',n+' إيصال أعيد إرساله'));render()},
 print:()=>window.print(),
 newPage:()=>modal(tr('New page','صفحة جديدة'),fld('en',tr('Page title (English)','عنوان الصفحة (إنجليزي)'),'<input id="m-en" name="en" required>',1)+fld('ar',tr('Page title (Arabic)','عنوان الصفحة (عربي)'),'<input id="m-ar" name="ar" dir="rtl">'),f=>{PAGES.unshift({en:f.get('en'),ar:f.get('ar')||f.get('en'),url:'index.html',pub:false,ed:0});store.set('pages',PAGES);toast(tr('Draft page created','تم إنشاء صفحة مسودة'));render()},tr('Create draft','إنشاء مسودة')),
 mediaOpen:d=>{const m=MEDIA[d.i];modal(esc(m.title),'<img src="'+m.src+'" alt="" style="width:100%;border-radius:14px;margin-bottom:12px"><div class="set"><span class="muted">'+tr('File','الملف')+'</span><b>'+esc(m.name)+'</b></div><div class="set"><span class="muted">'+tr('Size','الحجم')+'</span><b>'+m.size+'</b></div>',null,null,'<button type="button" class="btn btn-o" id="m-copy">'+ic('link')+tr('Copy link','نسخ الرابط')+'</button>');
   $('#m-copy').onclick=()=>{const u=new URL(m.src,location.href).href;(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>toast(tr('Link copied','تم نسخ الرابط')),()=>toast(u))}},
 inviteUser:()=>modal(tr('Invite user','دعوة مستخدم'),fld('n',tr('Full name','الاسم الكامل'),'<input id="m-n" name="n" required>',1)+fld('e',tr('E-mail','البريد الإلكتروني'),'<input id="m-e" name="e" type="email" required>',1)+fld('r',tr('Role','الدور'),'<select id="m-r" name="r">'+Object.entries(ROLES).map(([k,r])=>'<option value="'+k+'">'+tr(r[0],r[1])+'</option>').join('')+'</select>'),f=>{
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.get('e'))){const i=$('#m-e');i.setAttribute('aria-invalid','true');i.parentElement.querySelector('.err').textContent=tr('Enter a valid e-mail','أدخل بريدًا صحيحًا');return false}
   USERS.push({name:f.get('n'),email:f.get('e'),role:f.get('r'),active:true,last:0});store.set('users',USERS);toast(tr('Invitation sent (preview)','تم إرسال الدعوة (معاينة)'));render()},tr('Send invite','إرسال الدعوة')),
 editUser:d=>{const u=USERS[d.i];modal(tr('Edit user','تعديل المستخدم'),fld('n',tr('Full name','الاسم الكامل'),'<input id="m-n" name="n" required value="'+esc(u.name)+'">',1)+fld('r',tr('Role','الدور'),'<select id="m-r" name="r">'+Object.entries(ROLES).map(([k,r])=>'<option value="'+k+'"'+(u.role===k?' selected':'')+'>'+tr(r[0],r[1])+'</option>').join('')+'</select>')+'<div class="set"><span><b>'+tr('Account active','الحساب نشط')+'</b></span><label class="toggle"><input type="checkbox" name="a"'+(u.active?' checked':'')+'><span></span></label></div>',f=>{u.name=f.get('n');u.role=f.get('r');u.active=!!f.get('a');store.set('users',USERS);toast(tr('User updated','تم تحديث المستخدم'));render()})},
 saveSettings:()=>{store.set('settings',SETTINGS);GOAL=+SETTINGS.monthlyGoal||GOAL;toast(tr('Settings saved','تم حفظ الإعدادات'))}
};
/* live mode: actions write to Odoo (or open the record in Odoo for full editing) */
const reload=onlyIfNew=>fetch('/alihsan/dashboard/data',{credentials:'same-origin'}).then(r=>{if(!r.ok)throw new Error(tr('Could not refresh the data','تعذر تحديث البيانات'));return r.json()}).then(s=>{
  const first=DONATIONS[0]?.id,count=DONATIONS.length,fill=(a,b)=>{a.length=0;b.forEach(x=>a.push(x))};
  fill(DONATIONS,toDates(s.donations));DONATIONS.sort((a,b)=>b.date-a.date);fill(DONORS,s.donors);fill(CITIES,s.cities);
  CAMPAIGNS=s.campaigns;USERS=s.users;PAGES=s.pages;MEDIA=s.media;SRV.web=s.web;NOTES=realNotes();drawNav();drawNotes();
  if(!onlyIfNew||DONATIONS[0]?.id!==first||DONATIONS.length!==count)render()});
if(SRV){
  const noKiosk=()=>toast(tr('No kiosks are connected yet','لا توجد أكشاك متصلة بعد'));
  const campFormSrv=c=>fld('en',tr('Campaign name (English)','اسم الحملة (إنجليزي)'),'<input id="m-en" name="en" required value="'+esc(c?.en||'')+'">',1)+
    (SRV.arabic?fld('ar',tr('Campaign name (Arabic)','اسم الحملة (عربي)'),'<input id="m-ar" name="ar" dir="rtl" value="'+esc(c&&c.ar!==c.en?c.ar:'')+'">'):'')+
    fld('desc',tr('Short description','وصف مختصر'),'<textarea id="m-desc" name="desc" rows="2">'+esc(c?.den||'')+'</textarea>')+
    '<div class="fld-2">'+fld('goal',tr('Goal','الهدف')+' ('+CUR+')','<input id="m-goal" name="goal" type="number" min="0" required value="'+(c?c.goal:50000)+'">',1)+
    fld('img',tr('Image','الصورة'),'<input id="m-img" name="img" type="file" accept="image/*">')+'</div>';
  const saveCamp=(c,f,extra)=>readFile(f.get('img')).then(image=>rpc('/alihsan/dashboard/campaign/save',Object.assign({campaign_id:c?c.id:null,en:f.get('en'),ar:f.get('ar'),desc:f.get('desc'),goal:+f.get('goal'),image},extra)));
  const setState=(id,state,msg)=>rpc('/alihsan/dashboard/campaign/state',{campaign_id:id,state}).then(()=>reload()).then(()=>toast(msg)).catch(fail);
  Object.assign(ACT,{
   newCampaign:()=>modal(tr('Create campaign','إنشاء حملة'),campFormSrv(null)+fld('st',tr('Status','الحالة'),'<select id="m-st" name="st"><option value="active">'+tr('Publish now','نشر الآن')+'</option><option value="draft">'+tr('Save as draft','حفظ كمسودة')+'</option></select>'),f=>{
     saveCamp(null,f,{publish:f.get('st')==='active'}).then(()=>{closeModal();campTab='all';location.hash='#campaigns';return reload()}).then(()=>toast(tr('Campaign created','تم إنشاء الحملة'))).catch(fail);return false},tr('Create','إنشاء')),
   editCampaign:d=>{const c=camp(d.id);modal(tr('Edit campaign','تعديل الحملة'),campFormSrv(c),f=>{saveCamp(c,f,{}).then(()=>{closeModal();return reload()}).then(()=>toast(tr('Campaign saved','تم حفظ الحملة'))).catch(fail);return false},null,
     '<button type="button" class="btn btn-d" id="m-del" style="margin-inline-end:auto">'+ic('trash')+tr('Archive','أرشفة')+'</button><button type="button" class="btn btn-g" id="m-odoo">'+ic('link')+tr('Open in Odoo','فتح في أودو')+'</button>');
     $('#m-odoo').onclick=()=>odoo('product.template/'+c.id);
     $('#m-del').onclick=()=>{if(confirm(tr('Archive this campaign? It will be removed from the website.','أرشفة هذه الحملة؟ ستتم إزالتها من الموقع.'))){closeModal();setState(c.id,'archive',tr('Campaign archived','تمت أرشفة الحملة'))}}},
   pauseCampaign:d=>setState(d.id,'draft',tr('Campaign unpublished from the website','تم إلغاء نشر الحملة من الموقع')),
   activateCampaign:d=>setState(d.id,'active',tr('Campaign published on the website','تم نشر الحملة على الموقع')),
   restartKiosk:noKiosk,syncAll:noKiosk,assignKiosk:noKiosk,
   addDonation:()=>odoo('sale.order/new'),
   resend:d=>{const x=DONATIONS.find(y=>y.id===d.id);odoo('sale.order/'+x.order)},
   retryAll:()=>odoo('action-sale.action_orders_to_invoice'),
   newPage:()=>modal(tr('New page','صفحة جديدة'),fld('en',tr('Page title','عنوان الصفحة'),'<input id="m-en" name="en" required>',1),f=>{
     rpc('/alihsan/dashboard/page/new',{name:f.get('en')}).then(()=>{closeModal();return reload()}).then(()=>toast(tr('Draft page created','تم إنشاء صفحة مسودة'))).catch(fail);return false},tr('Create draft','إنشاء مسودة')),
   inviteUser:()=>odoo('res.users/new'),
   editUser:d=>odoo('res.users/'+USERS[d.i].id),
   saveSettings:()=>rpc('/alihsan/dashboard/settings',{settings:SETTINGS}).then(()=>{GOAL=+SETTINGS.monthlyGoal||GOAL;toast(tr('Settings saved','تم حفظ الإعدادات'))}).catch(fail)
  });
}
/* ---------- home page content: hero slides + home categories (always real Odoo records, also with sample data) ---------- */
let HOME=null,homeTab=store.get('homeTab','slides'),mediaTab=store.get('mediaTab','news');if(homeTab==='news'){homeTab='media';mediaTab='news'}
const loadHome=()=>rpc('/alihsan/dashboard/home/data',{}).then(d=>{HOME=d}).catch(e=>{HOME={error:e.message,slides:[],categories:[],icons:[],news:[],images:[],videos:[],events:[]}}).then(()=>{if(route().view==='website')render()});
const homeDo=(url,params,msg)=>rpc(url,params).then(loadHome).then(()=>msg&&toast(msg)).catch(fail);
const SLIDE_ST={live:['Live','منشورة','g'],scheduled:['Scheduled','مجدولة','b'],expired:['Expired','منتهية','r'],hidden:['Hidden','مخفية','']};
const localInput=iso=>{if(!iso)return '';const d=new Date(iso);return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,16)};
const utcValue=v=>v?new Date(v).toISOString().slice(0,19).replace('T',' '):false;
const arrows=(kind,id,i,n)=>'<button class="btn btn-g btn-sm hc-mv" type="button" data-act="'+kind+'Move" data-id="'+id+'" data-dir="up"'+(i===0?' disabled':'')+' aria-label="'+tr('Move up','تحريك لأعلى')+'" title="'+tr('Move up','تحريك لأعلى')+'">'+ic(LANG==='ar'?'up':'up')+'</button><button class="btn btn-g btn-sm hc-mv" type="button" data-act="'+kind+'Move" data-id="'+id+'" data-dir="down"'+(i===n-1?' disabled':'')+' aria-label="'+tr('Move down','تحريك لأسفل')+'" title="'+tr('Move down','تحريك لأسفل')+'">'+ic('down')+'</button>';
const homeLoading=()=>'<section class="card"><div class="empty"><b>'+tr('Loading…','جارٍ التحميل…')+'</b></div></section>';
const homeError=()=>'<section class="card"><div class="empty"><b>'+tr('Could not load the home page content','تعذر تحميل محتوى الصفحة الرئيسية')+'</b>'+esc(HOME.error)+'</div></section>';
const fdate=iso=>dfmt(new Date(iso),{day:'numeric',month:'short',year:'numeric'});
const slidesView=()=>{if(!HOME)return homeLoading();if(HOME.error)return homeError();const S=HOME.slides,E=HOME.can_edit;
  return '<section class="card"><div class="card-h"><h3>'+tr('Home hero slides','شرائح البانر الرئيسية')+'<span class="sub">'+(E?tr('Drag the slides to change the order of the home page banner.','اسحب الشرائح لتغيير ترتيب بانر الصفحة الرئيسية.'):tr('The banner slider at the top of the home page, shown in this order.','شريط البانر أعلى الصفحة الرئيسية، يُعرض بهذا الترتيب.'))+'</span></h3><div class="card-tools"><button class="btn btn-g btn-sm" type="button" data-act="openOdoo" data-path="'+HOME.slide_action+'">'+ic('link')+tr('Open in Odoo','فتح في أودو')+'</button>'+(E?'<button class="btn btn-p btn-sm" type="button" data-act="slideEdit">'+ic('plus')+tr('New slide','شريحة جديدة')+'</button>':'')+'</div></div><div class="card-b">'+
  (S.length?'<div class="cards'+(E?' sortable':'')+'" data-sort="slide">'+S.map((s,i)=>{const st=SLIDE_ST[s.state]||SLIDE_ST.hidden;return '<article class="card cc hs'+(s.active?'':' off')+'" data-sid="'+s.id+'"><div class="hs-img'+(E?' drag-h':'')+'"'+(E?' title="'+tr('Drag to change the order','اسحب لتغيير الترتيب')+'"':'')+'><img src="'+s.img+'" alt="" loading="lazy" draggable="false"><span class="chip hs-pos">'+(E?ic('grip'):'')+tr('Slide','شريحة')+' <span class="hs-n">'+(i+1)+'</span></span><span class="chip '+st[2]+' dot hs-st">'+tr(st[0],st[1])+'</span>'+(s.img_mobile?'<span class="chip hs-mob">'+ic('kiosk')+tr('Mobile image','صورة الجوال')+'</span>':'')+'</div>'+
    '<div class="card-b"><div style="display:flex;gap:10px;align-items:center"><h4 style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(s.name)+'</h4>'+(E?'<label class="toggle" title="'+tr('Published','منشورة')+'"><input type="checkbox" data-act="slideActive" data-id="'+s.id+'"'+(s.active?' checked':'')+' aria-label="'+tr('Published','منشورة')+'"><span></span></label>':'')+'</div>'+
    (s.tagline?'<small class="muted">“'+esc(s.tagline)+'”</small>':'')+
    '<div class="meta"><span class="hs-link">'+ic('link')+(s.link?'<span dir="ltr">'+esc(s.link)+'</span>'+(s.new_tab?' ↗':''):'<span style="color:var(--amber-ink)">'+tr('No link set','لا يوجد رابط')+'</span>')+'</span></div>'+
    (s.start||s.end?'<div class="meta"><span class="hs-link">'+ic('cal')+(s.start?tr('From ','من ')+fdate(s.start):'')+(s.end?tr(' until ',' حتى ')+fdate(s.end):'')+'</span></div>':'')+
    (E?'<div class="cc-f">'+arrows('slide',s.id,i,S.length)+'<button class="btn btn-g btn-sm" type="button" data-act="slideEdit" data-id="'+s.id+'">'+ic('edit')+tr('Edit','تعديل')+'</button></div>':'')+'</div></article>'}).join('')+'</div>':
   '<div class="empty"><b>'+tr('No slides yet','لا توجد شرائح بعد')+'</b>'+tr('Add the first banner of the home page.','أضف أول بانر للصفحة الرئيسية.')+'</div>')+'</div></section>'};
const catRow=(c,i,n,E)=>'<div class="row hc-row'+(c.shown?'':' off')+'" data-sid="'+c.id+'">'+(E&&c.shown?'<span class="drag-h hc-grip" title="'+tr('Drag to change the order','اسحب لتغيير الترتيب')+'">'+ic('grip')+'</span>':'')+'<span class="ic g hc-ic">'+(c.icon==='image'&&c.img?'<img src="'+c.img+'" alt="">':c.preview)+'</span><span class="row-t"><b>'+esc(c.name)+'</b><small>'+(c.path!==c.name?esc(c.path)+' · ':'')+(c.url?'<span dir="ltr">'+esc(c.url)+'</span>':tr('Opens the shop category','يفتح فئة المتجر'))+'</small></span>'+
  (E?(c.shown?'<span class="hc-mvs">'+arrows('cat',c.id,i,n)+'</span>':'')+'<label class="toggle" title="'+tr('On home page','في الصفحة الرئيسية')+'"><input type="checkbox" data-act="catShown" data-id="'+c.id+'"'+(c.shown?' checked':'')+' aria-label="'+tr('On home page','في الصفحة الرئيسية')+'"><span></span></label><button class="btn btn-g btn-sm" type="button" data-act="catEdit" data-id="'+c.id+'">'+ic('edit')+'<span class="hc-hide">'+tr('Edit','تعديل')+'</span></button>':'<span class="chip '+(c.shown?'g':'')+' dot">'+(c.shown?tr('On home page','في الرئيسية'):tr('Not on home page','ليست في الرئيسية'))+'</span>')+'</div>';
const catsView=()=>{if(!HOME)return homeLoading();if(HOME.error)return homeError();const E=HOME.can_edit,on=HOME.categories.filter(c=>c.shown),off=HOME.categories.filter(c=>!c.shown);
  return '<div class="g-1-1"><section class="card"><div class="card-h"><h3>'+tr('On home page','في الصفحة الرئيسية')+'<span class="sub">'+tr('“Our Projects” carousel, in this order','شريط “مشاريعنا” بهذا الترتيب')+'</span></h3><div class="card-tools"><button class="btn btn-g btn-sm" type="button" data-act="openOdoo" data-path="'+HOME.category_action+'">'+ic('link')+tr('Open in Odoo','فتح في أودو')+'</button>'+(E?'<button class="btn btn-p btn-sm" type="button" data-act="catEdit">'+ic('plus')+tr('New category','فئة جديدة')+'</button>':'')+'</div></div><div class="card-b"><div class="rows'+(E?' sortable':'')+'" data-sort="category">'+
   (on.length?on.map((c,i)=>catRow(c,i,on.length,E)).join(''):'<div class="empty"><b>'+tr('Nothing on the home page yet','لا شيء في الصفحة الرئيسية بعد')+'</b>'+tr('Switch a category on to show it in the carousel.','فعّل فئة لعرضها في الشريط.')+'</div>')+'</div></div></section>'+
  '<section class="card"><div class="card-h"><h3>'+tr('Not on home page','ليست في الصفحة الرئيسية')+'<span class="sub">'+off.length+' '+tr('categories','فئات')+'</span></h3>'+searchBox('hcats',tr('Search categories…','ابحث في الفئات…'))+'</div><div class="card-b"><div class="rows" id="hcats-l">'+offRows()+'</div></div></section></div>'};
const offRows=()=>{const q=(TS.hcats?.q||'').toLowerCase(),list=HOME.categories.filter(c=>!c.shown&&c.path.toLowerCase().includes(q));return list.length?list.map(c=>catRow(c,0,1,HOME.can_edit)).join(''):'<div class="empty"><b>'+tr('No categories','لا توجد فئات')+'</b></div>'};
const pagesView=()=>'<section class="card"><div class="card-h"><h3>'+tr('Pages','الصفحات')+'</h3>'+searchBox('pages',tr('Search pages…','ابحث في الصفحات…'))+'</div><div class="card-b" style="padding-inline:0">'+
  table('pages',{rows:()=>PAGES,text:p=>p.en+' '+p.ar,per:8,cols:[{k:'n',h:()=>tr('Page','الصفحة'),v:p=>p.en,r:p=>'<b>'+tr(p.en,p.ar)+'</b>'},{k:'s',h:()=>tr('Status','الحالة'),v:p=>p.pub,r:p=>p.pub?'<span class="chip g dot">'+tr('Published','منشور')+'</span>':'<span class="chip a dot">'+tr('Draft','مسودة')+'</span>'},{k:'e',h:()=>tr('Last edited','آخر تعديل'),v:p=>-p.ed,r:p=>ago(p.ed*1440+30)},{k:'p',h:()=>tr('Live','منشور'),r:p=>{const i=PAGES.indexOf(p);return '<label class="toggle"><input type="checkbox" data-act="togglePage" data-i="'+i+'"'+(p.pub?' checked':'')+' aria-label="'+tr('Publish','نشر')+' '+esc(tr(p.en,p.ar))+'"><span></span></label>'}},{k:'o',h:()=>'',r:p=>'<a class="btn btn-g btn-sm" href="'+p.url+'" target="_blank" rel="noopener">'+ic('eye')+tr('View','عرض')+'</a>'}]})+'</div></section>';
/* media center news: stories of the "News List Section" snippet, newest first, the featured one shown large */
const isoToday=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const newsCards=()=>{const q=(TS.hnews?.q||'').toLowerCase(),E=HOME.can_edit,list=HOME.news.filter(n=>(n.name+' '+n.tag+' '+n.summary).toLowerCase().includes(q));
  return list.length?list.map(n=>'<article class="card cc hs'+(n.active?'':' off')+'"><div class="hs-img hn-img"><img src="'+n.img+'" alt="" loading="lazy">'+(n.tag?'<span class="chip hs-pos">'+esc(n.tag)+'</span>':'')+'<span class="chip '+(n.active?'g':'')+' dot hs-st">'+(n.active?tr('Published','منشور'):tr('Hidden','مخفي'))+'</span>'+(n.featured?'<span class="chip gold hs-mob">'+ic('heart')+tr('Featured','مميز')+'</span>':'')+'</div>'+
    '<div class="card-b"><div style="display:flex;gap:10px;align-items:center"><h4 style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+esc(n.name)+'">'+esc(n.name)+'</h4>'+(E?'<label class="toggle" title="'+tr('Published','منشور')+'"><input type="checkbox" data-act="newsActive" data-id="'+n.id+'"'+(n.active?' checked':'')+' aria-label="'+tr('Published','منشور')+'"><span></span></label>':'')+'</div>'+
    '<div class="meta"><span class="hs-link">'+ic('cal')+fdate(n.date+'T00:00')+'</span></div>'+
    (n.summary?'<small class="muted hn-sum">'+esc(n.summary)+'</small>':'')+
    '<div class="meta"><span class="hs-link">'+ic('link')+(n.link?'<span dir="ltr">'+esc(n.link)+'</span>'+(n.new_tab?' ↗':''):'<a href="'+esc(n.url)+'" target="_blank" rel="noopener" dir="ltr">'+esc(n.url)+'</a>'+(n.body?'':' <span class="muted">· '+tr('no full story yet','لا يوجد نص كامل بعد')+'</span>'))+'</span></div>'+
    (E?'<div class="cc-f"><button class="btn btn-g btn-sm" type="button" data-act="newsFeature" data-id="'+n.id+'" data-on="'+(n.featured?1:0)+'">'+ic('heart')+(n.featured?tr('Unfeature','إلغاء التمييز'):tr('Feature','تمييز'))+'</button><button class="btn btn-g btn-sm" type="button" data-act="newsEdit" data-id="'+n.id+'">'+ic('edit')+tr('Edit','تعديل')+'</button></div>':'')+'</div></article>').join(''):
   '<div class="empty" style="grid-column:1/-1"><b>'+(q?tr('No matching stories','لا توجد أخبار مطابقة'):tr('No news yet','لا توجد أخبار بعد'))+'</b>'+(q?'':tr('Add the first story of the Media Center.','أضف أول خبر للمركز الإعلامي.'))+'</div>'};
const newsView=()=>{if(!HOME)return homeLoading();if(HOME.error)return homeError();const E=HOME.can_edit;
  return '<section class="card"><div class="card-h"><h3>'+tr('Media Center news','أخبار المركز الإعلامي')+'<span class="sub">'+tr('The “Latest news” list, newest first. The featured story is shown large at the top.','قائمة “آخر الأخبار”، الأحدث أولًا. الخبر المميز يظهر بحجم كبير في الأعلى.')+'</span></h3><div class="card-tools">'+searchBox('hnews',tr('Search news…','ابحث في الأخبار…'))+'<button class="btn btn-g btn-sm" type="button" data-act="openOdoo" data-path="'+HOME.news_action+'">'+ic('link')+tr('Open in Odoo','فتح في أودو')+'</button>'+(E?'<button class="btn btn-p btn-sm" type="button" data-act="newsEdit">'+ic('plus')+tr('New story','خبر جديد')+'</button>':'')+'</div></div><div class="card-b">'+
  '<div class="cards" id="hnews-l">'+newsCards()+'</div></div></section>'};
const newsForm=n=>fld('nn',tr('Title','العنوان'),'<input id="m-nn" name="name" required value="'+esc(n?.name||'')+'" placeholder="'+tr('e.g. New partnership agreement signed','مثال: توقيع اتفاقية شراكة جديدة')+'">',1)+
  '<div class="fld-2">'+fld('nd',tr('Date','التاريخ'),'<input id="m-nd" name="date" type="date" required value="'+(n?.date||isoToday())+'">',1)+
  fld('nt',tr('Tag','الوسم'),'<input id="m-nt" name="tag" list="m-ntl" value="'+esc(n?.tag||'')+'" placeholder="Campaigns"><datalist id="m-ntl">'+[...new Set(HOME.news.map(x=>x.tag).filter(Boolean))].map(t=>'<option value="'+esc(t)+'">').join('')+'</datalist>')+'</div>'+
  fld('ni',tr('Image','الصورة')+' <small class="muted">1200×800</small>',(n?'<img class="hc-prev" src="'+n.img+'" alt="">':'')+'<input id="m-ni" name="image" type="file" accept="image/*"'+(n?'':' required')+'>',!n)+
  fld('ns',tr('Summary','الملخص'),'<textarea id="m-ns" name="summary" rows="3" placeholder="'+tr('Short text shown under the title','نص قصير يظهر تحت العنوان')+'">'+esc(n?.summary||'')+'</textarea>')+
  fld('nb',tr('Full story','النص الكامل')+' <small class="muted">'+tr('shown on the story page opened by “Read more”; leave a blank line between paragraphs','يظهر في صفحة الخبر التي يفتحها “اقرأ المزيد”؛ اترك سطرًا فارغًا بين الفقرات')+'</small>','<textarea id="m-nb" name="body" rows="8" placeholder="'+tr('Text of the story page','نص صفحة الخبر')+'">'+esc(n?.body||'')+'</textarea>')+
  fld('nl',tr('Other “Read more” link','رابط آخر لـ “اقرأ المزيد”')+' <small class="muted">'+tr('optional','اختياري')+'</small>','<input id="m-nl" name="link" dir="ltr" value="'+esc(n?.link||'')+'" placeholder="'+tr('Empty: open the story page','فارغ: فتح صفحة الخبر')+'">')+
  '<div class="set"><span><b>'+tr('Open link in a new tab','فتح الرابط في علامة تبويب جديدة')+'</b></span><label class="toggle"><input type="checkbox" name="new_tab"'+(n?.new_tab?' checked':'')+'><span></span></label></div>'+
  '<div class="set"><span><b>'+tr('Featured','مميز')+'</b><small>'+tr('Show this story large at the top of the list.','عرض هذا الخبر بحجم كبير أعلى القائمة.')+'</small></span><label class="toggle"><input type="checkbox" name="featured"'+(n?.featured?' checked':'')+'><span></span></label></div>'+
  '<div class="set"><span><b>'+tr('Published','منشور')+'</b><small>'+tr('Uncheck to hide the story without deleting it.','ألغِ التحديد لإخفاء الخبر دون حذفه.')+'</small></span><label class="toggle"><input type="checkbox" name="active"'+(!n||n.active?' checked':'')+'><span></span></label></div>';
/* home popup: the "Featured project" dialog shown over the home page when it loads */
const popupAmounts=v=>String(v||'').split(',').map(x=>parseInt(x)).filter(x=>x>0);
const popupView=()=>{if(!HOME)return homeLoading();if(HOME.error||!HOME.popup)return homeError();const P=HOME.popup,E=HOME.can_edit,pr=P.projects.find(x=>x.id===P.product_id),cur=' <em>'+esc(P.currency)+'</em>';
  const when=(P.frequency==='session'?tr('Once per visit','مرة واحدة في كل زيارة'):tr('Every time the home page loads','في كل مرة تُحمَّل فيها الصفحة الرئيسية'))+' · '+tr('after ','بعد ')+P.delay+tr(' s',' ث');
  const off=pr&&!pr.published?'<p class="pp-warn">'+ic('alert')+tr('This project is not published, so the popup is not shown.','هذا المشروع غير منشور، لذلك لا تظهر النافذة.')+'</p>':'';
  return '<section class="card"><div class="card-h"><h3>'+tr('Home page popup','النافذة المنبثقة للصفحة الرئيسية')+'<span class="sub">'+tr('The “Featured project” dialog shown over the home page when it loads. “Donate now” adds the selected amount to the cart.','نافذة “مشروع مميز” التي تظهر فوق الصفحة الرئيسية عند تحميلها. “تبرع الآن” يضيف المبلغ المختار إلى السلة.')+'</span></h3><div class="card-tools">'+
  (E?'<label class="toggle" title="'+tr('Show the popup','إظهار النافذة')+'"><input type="checkbox" data-act="popupActive"'+(P.active?' checked':'')+' aria-label="'+tr('Show the popup','إظهار النافذة')+'"><span></span></label>':'')+
  '<button class="btn btn-g btn-sm" type="button" data-act="openOdoo" data-path="'+P.settings_action+'">'+ic('link')+tr('Open in Odoo','فتح في أودو')+'</button>'+(E?'<button class="btn btn-p btn-sm" type="button" data-act="popupEdit">'+ic('edit')+tr('Edit popup','تعديل النافذة')+'</button>':'')+'</div></div><div class="card-b">'+
  (!pr?'<div class="empty"><b>'+tr('No project chosen yet','لم يتم اختيار مشروع بعد')+'</b>'+tr('Choose the donation project the popup promotes.','اختر مشروع التبرع الذي تعرضه النافذة.')+'</div>':
  off+'<div class="pp'+(P.active?'':' off')+'"><figure class="pp-media"><img src="'+esc(P.img||pr.img)+'" alt=""><span class="chip '+(P.active?'g':'')+' dot">'+(P.active?tr('Shown','ظاهرة'):tr('Off','متوقفة'))+'</span></figure><div class="pp-body">'+
  (P.eyebrow?'<span class="pp-eye">'+esc(P.eyebrow)+'</span>':'')+'<h4>'+esc(P.title||pr.name)+'</h4>'+
  (pr.goal>0?'<div class="pp-lbl"><span><small>'+tr('Current','المُحصّل')+'</small><b>'+nf(pr.raised)+cur+'</b></span><span><small>'+tr('Goal','الهدف')+'</small><b>'+nf(pr.goal)+cur+'</b></span></div><div class="pp-bar"><i style="width:'+pr.progress.toFixed(2)+'%"></i></div><span class="pp-pct">'+pr.progress.toFixed(2)+'%</span>':'<small class="muted">'+tr('No goal set: the progress bar is hidden.','لا يوجد هدف: شريط التقدم مخفي.')+'</small>')+
  ((P.description||pr.desc)?'<p>'+esc(P.description||pr.desc)+'</p>':'')+
  '<div class="pp-chips">'+popupAmounts(P.amounts).map(a=>'<span class="'+(a===P.default?'on':'')+'">'+ic('heart')+nf(a)+cur+'</span>').join('')+'</div>'+
  '<div class="meta"><span class="hs-link">'+ic('clock')+when+'</span></div><div class="meta"><span class="hs-link">'+ic('link')+'<span dir="ltr">'+esc(P.explore_url||pr.url)+'</span></span></div></div></div>')+
  '</div></section>'};
const popupForm=P=>{const pr0=P.projects.find(x=>x.id===P.product_id)||{};
  return fld('pp',tr('Project','المشروع'),'<select id="m-pp" name="product" required><option value="">'+tr('Choose a donation project…','اختر مشروع تبرع…')+'</option>'+P.projects.map(x=>'<option value="'+x.id+'"'+(x.id===P.product_id?' selected':'')+'>'+esc(x.name)+(x.published?'':' ('+tr('not published','غير منشور')+')')+'</option>').join('')+'</select>',1)+
  '<div class="fld-2">'+fld('pg',tr('Goal','الهدف')+' <small class="muted">'+esc(P.currency)+'</small>','<input id="m-pg" name="goal" type="number" min="0" step="1" value="'+(pr0.goal||0)+'">')+
  fld('po',tr('Raised outside the website','المُحصّل خارج الموقع')+' <small class="muted">'+esc(P.currency)+'</small>','<input id="m-po" name="offline" type="number" min="0" step="1" value="'+(pr0.offline||0)+'">')+'</div>'+
  '<p class="muted" style="margin:-8px 0 12px;font-size:12.5px">'+tr('Current = online donations + raised outside the website. Goal 0 hides the progress bar. Both are saved on the project.','المُحصّل = تبرعات الموقع + المُحصّل خارج الموقع. الهدف 0 يخفي شريط التقدم. يُحفظان في المشروع.')+'</p>'+
  fld('pi',tr('Image','الصورة')+' <small class="muted">'+tr('800×1000, optional — the project image is used otherwise','800×1000، اختياري — تُستخدم صورة المشروع بدونه')+'</small>',(P.has_img?'<img class="hc-prev" src="'+P.img+'" alt=""><label class="muted" style="display:flex;gap:6px;align-items:center;font-size:12.5px;margin:6px 0"><input type="checkbox" name="rm"> '+tr('Use the project image instead','استخدام صورة المشروع بدلًا منها')+'</label>':'')+'<input id="m-pi" name="image" type="file" accept="image/*">')+
  '<div class="fld-2">'+fld('pe',tr('Label','العنوان الصغير'),'<input id="m-pe" name="eyebrow" value="'+esc(P.eyebrow)+'" placeholder="Featured project">')+
  fld('pt',tr('Title','العنوان'),'<input id="m-pt" name="title" value="'+esc(P.title)+'" placeholder="'+tr('Project name','اسم المشروع')+'">')+'</div>'+
  fld('pd',tr('Text','النص'),'<textarea id="m-pd" name="description" rows="3" placeholder="'+tr('Empty: the project’s short description','فارغ: الوصف المختصر للمشروع')+'">'+esc(P.description)+'</textarea>')+
  '<div class="fld-2">'+fld('pa',tr('Amount buttons','أزرار المبالغ'),'<input id="m-pa" name="amounts" dir="ltr" value="'+esc(P.amounts)+'" placeholder="10,15,25,50,100,200">')+
  fld('pv',tr('Selected amount','المبلغ المختار'),'<input id="m-pv" name="default" type="number" min="0" step="1" value="'+P.default+'">')+'</div>'+
  fld('pu',tr('“Explore More” link','رابط “اكتشف المزيد”'),'<input id="m-pu" name="explore" dir="ltr" value="'+esc(P.explore_url)+'" placeholder="'+tr('Empty: the project page','فارغ: صفحة المشروع')+'">')+
  '<div class="fld-2">'+fld('pf',tr('Show','العرض'),'<select id="m-pf" name="frequency"><option value="always"'+(P.frequency==='always'?' selected':'')+'>'+tr('Every time the home page loads','في كل مرة تُحمَّل فيها الصفحة')+'</option><option value="session"'+(P.frequency==='session'?' selected':'')+'>'+tr('Once per visit','مرة واحدة في كل زيارة')+'</option></select>')+
  fld('pw',tr('Delay (seconds)','التأخير (ثوانٍ)'),'<input id="m-pw" name="delay" type="number" min="0" max="60" step="1" value="'+P.delay+'">')+'</div>'+
  '<div class="set"><span><b>'+tr('Show the popup','إظهار النافذة')+'</b><small>'+tr('Switch off to stop showing it without losing its content.','أوقفه لإخفاء النافذة دون فقدان محتواها.')+'</small></span><label class="toggle"><input type="checkbox" name="active"'+(P.active?' checked':'')+'><span></span></label></div>'};
/* media center: News | Images | Videos | Events, the four pages of the website's Media Center */
const MC={
  images:{one:['Gallery','المعرض'],add:['New gallery','معرض جديد'],title:['Image galleries','معارض الصور'],sub:['The “All Galleries” grid of the Images page, newest first. Each gallery opens its own photos.','شبكة “كل المعارض” في صفحة الصور، الأحدث أولًا. كل معرض يفتح صوره.'],ph:['Search galleries…','ابحث في المعارض…'],none:['No galleries yet','لا توجد معارض بعد']},
  videos:{one:['Video','الفيديو'],add:['New video','فيديو جديد'],title:['Videos','الفيديوهات'],sub:['The “All Videos” grid of the Videos page, newest first. YouTube and Vimeo links play on the page.','شبكة “كل الفيديوهات” في صفحة الفيديو، الأحدث أولًا. روابط يوتيوب وفيميو تعمل داخل الصفحة.'],ph:['Search videos…','ابحث في الفيديوهات…'],none:['No videos yet','لا توجد فيديوهات بعد']},
  events:{one:['Event','الفعالية'],add:['New event','فعالية جديدة'],title:['Events','الفعاليات'],sub:['The “All Events” grid of the Events page. Events from today on show as Upcoming.','شبكة “كل الفعاليات” في صفحة الفعاليات. الفعاليات من اليوم فصاعدًا تظهر كقادمة.'],ph:['Search events…','ابحث في الفعاليات…'],none:['No events yet','لا توجد فعاليات بعد']}};
const MC_TABS=[['news','News','الأخبار'],['images','Images','الصور'],['videos','Videos','الفيديو'],['events','Events','الفعاليات']];
const PLATFORM={youtube:'YouTube',vimeo:'Vimeo',dailymotion:'Dailymotion',instagram:'Instagram',facebook:'Facebook'};
const mediaView=()=>{if(!HOME)return homeLoading();if(HOME.error)return homeError();
  return '<div class="seg mc-seg" role="tablist" aria-label="'+tr('Media Center','المركز الإعلامي')+'">'+MC_TABS.map(t=>'<button type="button" role="tab" data-mtab="'+t[0]+'" aria-selected="'+(mediaTab===t[0])+'" class="'+(mediaTab===t[0]?'on':'')+'">'+tr(t[1],t[2])+' <span class="muted">'+(HOME[t[0]]||[]).length+'</span></button>').join('')+'</div>'+
  (mediaTab==='news'?newsView():mcView(MC[mediaTab]?mediaTab:'images'))};
const floatTime=f=>{if(!f)return '';const m=Math.round(f*60);return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
const mcCards=kind=>{const q=(TS['mc_'+kind]?.q||'').toLowerCase(),E=HOME.can_edit,K=MC[kind],list=HOME[kind].filter(x=>(x.name+' '+(x.location||'')+' '+(x.description||'')).toLowerCase().includes(q));
  return list.length?list.map(x=>{
    const badge=kind==='images'?'<span class="chip hs-pos">'+ic('image')+x.photos.length+' '+tr('photos','صور')+'</span>':kind==='videos'?'<span class="chip hs-pos">'+(x.platform?(PLATFORM[x.platform]||tr('Video file','ملف فيديو')):tr('No video yet','لا يوجد فيديو بعد'))+'</span>':'<span class="chip hs-pos">'+(x.upcoming?tr('Upcoming','قادمة'):tr('Past','سابقة'))+'</span>';
    return '<article class="card cc hs'+(x.active?'':' off')+'"><div class="hs-img hn-img">'+(x.img?'<img src="'+x.img+'" alt="" loading="lazy">':'<span class="mc-noimg">'+ic(kind==='videos'?'eye':'image')+'</span>')+badge+'<span class="chip '+(x.active?'g':'')+' dot hs-st">'+(x.active?tr('Published','منشور'):tr('Hidden','مخفي'))+'</span></div>'+
    '<div class="card-b"><div style="display:flex;gap:10px;align-items:center"><h4 style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+esc(x.name)+'">'+esc(x.name)+'</h4>'+(E?'<label class="toggle" title="'+tr('Published','منشور')+'"><input type="checkbox" data-act="mcActive" data-kind="'+kind+'" data-id="'+x.id+'"'+(x.active?' checked':'')+' aria-label="'+tr('Published','منشور')+'"><span></span></label>':'')+'</div>'+
    '<div class="meta"><span class="hs-link">'+ic('cal')+fdate(x.date+'T00:00')+(x.time_label?' · '+esc(x.time_label):'')+'</span></div>'+
    (kind==='events'&&x.location?'<div class="meta"><span class="hs-link">'+ic('pin')+esc(x.location)+'</span></div>':'')+
    (kind==='events'&&x.description?'<small class="muted hn-sum">'+esc(x.description)+'</small>':'')+
    (kind==='videos'?'<div class="meta"><span class="hs-link">'+ic('link')+(x.url?'<span dir="ltr">'+esc(x.url)+'</span>':'<span class="muted">'+tr('No video link','بدون رابط فيديو')+'</span>')+'</span></div>':'')+
    (E?'<div class="cc-f"><button class="btn btn-g btn-sm" type="button" data-act="mcEdit" data-kind="'+kind+'" data-id="'+x.id+'">'+ic('edit')+tr('Edit','تعديل')+'</button></div>':'')+'</div></article>'}).join(''):
   '<div class="empty" style="grid-column:1/-1"><b>'+(q?tr('Nothing matches','لا توجد نتائج'):tr(K.none[0],K.none[1]))+'</b></div>'};
const mcView=kind=>{const K=MC[kind],E=HOME.can_edit;
  return '<section class="card"><div class="card-h"><h3>'+tr(K.title[0],K.title[1])+'<span class="sub">'+tr(K.sub[0],K.sub[1])+'</span></h3><div class="card-tools">'+searchBox('mc_'+kind,tr(K.ph[0],K.ph[1]))+'<button class="btn btn-g btn-sm" type="button" data-act="openOdoo" data-path="'+HOME[kind+'_action']+'">'+ic('link')+tr('Open in Odoo','فتح في أودو')+'</button>'+(E?'<button class="btn btn-p btn-sm" type="button" data-act="mcEdit" data-kind="'+kind+'">'+ic('plus')+tr(K.add[0],K.add[1])+'</button>':'')+'</div></div><div class="card-b">'+
  '<div class="cards" id="mc-l">'+mcCards(kind)+'</div></div></section>'};
const pubSwitch=x=>'<div class="set"><span><b>'+tr('Published','منشور')+'</b><small>'+tr('Uncheck to hide it without deleting it.','ألغِ التحديد لإخفائه دون حذفه.')+'</small></span><label class="toggle"><input type="checkbox" name="active"'+(!x||x.active?' checked':'')+'><span></span></label></div>';
const mcForm=(kind,x)=>{const title=fld('mn',tr('Title','العنوان'),'<input id="m-mn" name="name" required value="'+esc(x?.name||'')+'">',1),
    date=lbl=>fld('md',lbl,'<input id="m-md" name="date" type="date" required value="'+(x?.date||isoToday())+'">',1);
  if(kind==='images')return title+date(tr('Held on','أقيم في'))+
    fld('mi',tr('Cover image','صورة الغلاف')+' <small class="muted">'+tr('optional — the first photo is used otherwise','اختياري — تُستخدم الصورة الأولى بدونه')+'</small>',(x?.has_cover?'<img class="hc-prev" src="'+x.img+'" alt="">':'')+'<input id="m-mi" name="image" type="file" accept="image/*">')+
    (x?.photos?.length?'<div class="fld"><label>'+tr('Photos','الصور')+' <small class="muted">'+tr('tick to remove','حدد للإزالة')+'</small></label><div class="mc-photos">'+x.photos.map(p=>'<label class="mc-ph"><img src="'+p.img+'" alt=""><input type="checkbox" name="rmp" value="'+p.id+'" aria-label="'+tr('Remove photo','إزالة الصورة')+'"></label>').join('')+'</div></div>':'')+
    fld('mp',tr('Add photos','إضافة صور')+' <small class="muted">'+tr('you can select several','يمكنك اختيار عدة صور')+'</small>','<input id="m-mp" name="photos" type="file" accept="image/*" multiple>')+pubSwitch(x);
  if(kind==='videos')return title+
    fld('mu',tr('Video link','رابط الفيديو'),'<input id="m-mu" name="video_url" dir="ltr" value="'+esc(x?.url||'')+'" placeholder="https://www.youtube.com/watch?v=…">')+
    '<p class="muted" style="margin:-8px 0 12px;font-size:12.5px">'+tr('YouTube, Vimeo, Dailymotion, Instagram or Facebook link, or an .mp4 address. Empty: “The video will be available here soon”.','رابط يوتيوب أو فيميو أو ديلي موشن أو إنستغرام أو فيسبوك، أو عنوان ملف mp4. فارغ: “سيتوفر الفيديو هنا قريبًا”.')+'</p>'+
    '<div class="fld-2">'+date(tr('Held on','أقيم في'))+fld('mi',tr('Thumbnail','الصورة المصغرة')+' <small class="muted">'+tr('optional','اختياري')+'</small>',(x?.img?'<img class="hc-prev" src="'+x.img+'" alt="">':'')+'<input id="m-mi" name="image" type="file" accept="image/*">')+'</div>'+
    '<p class="muted" style="margin:-8px 0 12px;font-size:12.5px">'+tr('Without a thumbnail, the YouTube / Vimeo one is used.','بدون صورة مصغرة تُستخدم صورة يوتيوب / فيميو.')+'</p>'+pubSwitch(x);
  return title+'<div class="fld-2">'+date(tr('Date','التاريخ'))+fld('mt',tr('Start time','وقت البدء'),'<input id="m-mt" name="time" type="time" value="'+floatTime(x?.time)+'">')+'</div>'+
    fld('ml',tr('Location','المكان'),'<input id="m-ml" name="location" value="'+esc(x?.location||'')+'" placeholder="'+tr('Venue to be announced','سيُعلن عن المكان')+'">')+
    fld('mi',tr('Image','الصورة'),(x?'<img class="hc-prev" src="'+x.img+'" alt="">':'')+'<input id="m-mi" name="image" type="file" accept="image/*"'+(x?'':' required')+'>',!x)+
    fld('ms',tr('Description','الوصف'),'<textarea id="m-ms" name="description" rows="3">'+esc(x?.description||'')+'</textarea>')+
    fld('mo',tr('“Donate to support” link','رابط “تبرع للدعم”'),'<input id="m-mo" name="donate_url" dir="ltr" value="'+esc(x?.donate_url||'')+'" placeholder="/shop">')+pubSwitch(x)};
const mcVals=(kind,f)=>{const v={name:f.get('name').trim(),date:f.get('date'),active:!!f.get('active')};
  if(kind==='videos')v.video_url=f.get('video_url').trim();
  if(kind==='events'){const t=f.get('time');Object.assign(v,{time:t?+t.slice(0,2)+(+t.slice(3,5))/60:0,location:f.get('location').trim(),description:f.get('description'),donate_url:f.get('donate_url').trim()})}
  return v};
/* drag and drop ordering (pointer events: mouse, pen and touch). Drag by a .drag-h handle inside a [data-sid] item. */
const bindHomeSort=()=>$$('.sortable[data-sort]').forEach(list=>{
  list.addEventListener('pointerdown',e=>{const h=e.target.closest('.drag-h');if(!h||e.button>0||e.target.closest('button,input,label,a'))return;
    const item=h.closest('[data-sid]');if(!item||!list.contains(item))return;e.preventDefault();
    const before=[...list.children].map(x=>x.dataset.sid).join(),r=item.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;
    const ghost=item.cloneNode(true);ghost.classList.add('drag-ghost');ghost.style.width=r.width+'px';ghost.style.height=r.height+'px';document.body.append(ghost);
    const place=(x,y)=>{ghost.style.transform='translate('+(x-dx)+'px,'+(y-dy)+'px) rotate(1.5deg)'};place(e.clientX,e.clientY);
    item.classList.add('drag-src');list.classList.add('drag-on');document.body.classList.add('drag-body');
    let sx=0,raf=0;const scroll=()=>{if(sx){window.scrollBy(0,sx);raf=requestAnimationFrame(scroll)}else raf=0};
    const move=ev=>{place(ev.clientX,ev.clientY);
      sx=ev.clientY<80?-12:ev.clientY>innerHeight-80?12:0;if(sx&&!raf)raf=requestAnimationFrame(scroll);
      const over=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('[data-sid]');if(!over||over===item||over.parentNode!==list)return;
      const kids=[...list.children],a=kids.indexOf(item),b=kids.indexOf(over),or=over.getBoundingClientRect();
      const grid=getComputedStyle(list).display==='grid'&&list.classList.contains('cards'),after=grid?b>a:ev.clientY>or.top+or.height/2;
      /* animate the cards that move out of the way */
      const first=new Map(kids.map(k=>[k,k.getBoundingClientRect()]));list.insertBefore(item,after?over.nextSibling:over);
      kids.forEach(k=>{if(k===item)return;const f=first.get(k),l=k.getBoundingClientRect(),mx=f.left-l.left,my=f.top-l.top;if(mx||my){k.animate([{transform:'translate('+mx+'px,'+my+'px)'},{transform:'none'}],{duration:180,easing:'ease-out'})}});
      $$('.hs-n',list).forEach((n,i)=>n.textContent=i+1)};
    const up=()=>{removeEventListener('pointermove',move);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);sx=0;
      ghost.remove();item.classList.remove('drag-src');list.classList.remove('drag-on');document.body.classList.remove('drag-body');
      const ids=[...list.children].map(x=>x.dataset.sid).filter(Boolean);if(ids.join()===before)return;
      rpc('/alihsan/dashboard/home/reorder',{kind:list.dataset.sort,ids:ids.map(Number)}).then(loadHome).then(()=>toast(tr('New order saved','تم حفظ الترتيب الجديد'))).catch(e=>{fail(e);loadHome()})};
    addEventListener('pointermove',move);addEventListener('pointerup',up);addEventListener('pointercancel',up)})});
const slideForm=s=>fld('sn',tr('Title','العنوان'),'<input id="m-sn" name="name" required value="'+esc(s?.name||'')+'" placeholder="'+tr('e.g. Poor Housing Campaign','مثال: حملة الإسكان')+'">',1)+
  '<p class="muted" style="margin:-8px 0 12px;font-size:12.5px">'+tr('Also used as the image alternative text.','يُستخدم أيضًا كنص بديل للصورة.')+'</p>'+
  '<div class="fld-2">'+fld('si',tr('Desktop image','صورة سطح المكتب')+' <small class="muted">1920×900</small>',(s?'<img class="hc-prev" src="'+s.img+'" alt="">':'')+'<input id="m-si" name="image" type="file" accept="image/*"'+(s?'':' required')+'>',!s)+
  fld('sm',tr('Mobile image','صورة الجوال')+' <small class="muted">1080×1920</small>',(s?.img_mobile?'<img class="hc-prev" src="'+s.img_mobile+'" alt=""><label style="display:flex;gap:8px;align-items:center;font-weight:600;font-size:13px"><input type="checkbox" name="rm" style="width:auto;height:auto"> '+tr('Remove mobile image','إزالة صورة الجوال')+'</label>':'')+'<input id="m-sm" name="image_mobile" type="file" accept="image/*">')+'</div>'+
  fld('st',tr('Caption','التعليق'),'<input id="m-st" name="tagline" value="'+esc(s?.tagline||'')+'" placeholder="CHARITABLE ENDOWMENT · GOOD THAT LIVES ON">')+
  fld('sl',tr('Link','الرابط'),'<input id="m-sl" name="link" dir="ltr" value="'+esc(s?.link||'')+'" placeholder="/projects-campaigns">')+
  '<div class="fld-2">'+fld('sf',tr('Show from','العرض من'),'<input id="m-sf" name="start" type="datetime-local" value="'+localInput(s?.start)+'">')+fld('su',tr('Show until','العرض حتى'),'<input id="m-su" name="end" type="datetime-local" value="'+localInput(s?.end)+'">')+'</div>'+
  '<div class="set"><span><b>'+tr('Open link in a new tab','فتح الرابط في علامة تبويب جديدة')+'</b></span><label class="toggle"><input type="checkbox" name="new_tab"'+(s?.new_tab?' checked':'')+'><span></span></label></div>'+
  '<div class="set"><span><b>'+tr('Published','منشورة')+'</b><small>'+tr('Uncheck to hide the slide without deleting it.','ألغِ التحديد لإخفاء الشريحة دون حذفها.')+'</small></span><label class="toggle"><input type="checkbox" name="active"'+(!s||s.active?' checked':'')+'><span></span></label></div>';
const catForm=c=>fld('cn',tr('Category name','اسم الفئة'),'<input id="m-cn" name="name" required value="'+esc(c?.name||'')+'">',1)+
  fld('cp',tr('Parent category','الفئة الأم'),'<select id="m-cp" name="parent"><option value="">'+tr('None (top level)','بدون (مستوى أعلى)')+'</option>'+HOME.categories.filter(x=>!c||(x.id!==c.id&&!x.path.startsWith(c.path+' / '))).map(x=>'<option value="'+x.id+'"'+(c?.parent===x.id?' selected':'')+'>'+esc(x.path)+'</option>').join('')+'</select>')+
  '<div class="fld-2">'+fld('ci',tr('Home icon','أيقونة الرئيسية'),'<select id="m-ci" name="icon">'+HOME.icons.map(o=>'<option value="'+o[0]+'"'+((c?.icon||'heart')===o[0]?' selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select>')+
  fld('cg',tr('Category image','صورة الفئة'),(c?.img?'<img class="hc-prev sq" src="'+c.img+'" alt="">':'')+'<input id="m-cg" name="image" type="file" accept="image/*">')+'</div>'+
  fld('cu',tr('Home link','رابط الرئيسية'),'<input id="m-cu" name="url" dir="ltr" value="'+esc(c?.url||'')+'" placeholder="'+tr('Leave empty to open this category in the shop','اتركه فارغًا لفتح الفئة في المتجر')+'">')+
  '<div class="set"><span><b>'+tr('Show on home page','عرض في الصفحة الرئيسية')+'</b><small>'+tr('In the “Our Projects” carousel','في شريط “مشاريعنا”')+'</small></span><label class="toggle"><input type="checkbox" name="shown"'+(c?.shown?' checked':'')+'><span></span></label></div>';
Object.assign(ACT,{
 openOdoo:d=>odoo(d.path),
 slideEdit:d=>{const s=d.id?HOME.slides.find(x=>x.id===+d.id):null;
   modal(s?tr('Edit slide','تعديل الشريحة'):tr('New slide','شريحة جديدة'),slideForm(s),f=>{
     const name=f.get('name').trim(),active=!!f.get('active'),start=f.get('start');
     saving(Promise.all([readFile(f.get('image')),readFile(f.get('image_mobile'))]).then(([image,image_mobile])=>rpc('/alihsan/dashboard/slide/save',{slide_id:s?s.id:null,image,image_mobile,remove_mobile:!!f.get('rm'),
       vals:{name,tagline:f.get('tagline'),link_url:f.get('link'),link_new_tab:!!f.get('new_tab'),active,date_start:utcValue(start),date_end:utcValue(f.get('end'))}})))
     .then(()=>{closeModal();
       const where=!active?tr('Hidden — switch “Published” on to show it.','مخفية — فعّل “منشورة” لعرضها.'):start&&new Date(start)>new Date()?tr('Scheduled from ','مجدولة من ')+dfmt(new Date(start),{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):s?tr('Live on the home page','منشورة في الصفحة الرئيسية'):tr('“'+name+'” is now Slide '+(HOME.slides.length+1)+' on the home page','“'+name+'” أصبحت الشريحة '+(HOME.slides.length+1)+' في الصفحة الرئيسية');
       toast(s?tr('Banner updated','تم تحديث البانر'):tr('Banner added','تمت إضافة البانر'),{sub:where});return loadHome()}).catch(fail);return false},s?null:tr('Add slide','إضافة الشريحة'),
     s?'<button type="button" class="btn btn-d" id="m-del" style="margin-inline-end:auto">'+ic('trash')+tr('Delete','حذف')+'</button>':'');
   if(s)$('#m-del').onclick=()=>{if(confirm(tr('Delete this slide?','حذف هذه الشريحة؟'))){closeModal();homeDo('/alihsan/dashboard/slide/action',{slide_id:s.id,action:'delete'},tr('Slide deleted','تم حذف الشريحة'))}}},
 slideMove:d=>homeDo('/alihsan/dashboard/slide/action',{slide_id:+d.id,action:d.dir}),
 catEdit:d=>{const c=d.id?HOME.categories.find(x=>x.id===+d.id):null;
   modal(c?tr('Edit category','تعديل الفئة'):tr('New category','فئة جديدة'),catForm(c),f=>{
     const shown=!!f.get('shown');
     saving(readFile(f.get('image')).then(image=>rpc('/alihsan/dashboard/category/save',{category_id:c?c.id:null,image,
       vals:{name:f.get('name'),parent_id:f.get('parent'),ih_home_icon:f.get('icon'),ih_home_url:f.get('url'),ih_home_display:shown?'shown':'unlisted'}})))
     .then(()=>{closeModal();toast(c?tr('Category updated','تم تحديث الفئة'):tr('Category added','تمت إضافة الفئة'),{sub:shown?tr('Shown in the “Our Projects” carousel','تظهر في شريط “مشاريعنا”'):tr('Not on the home page','ليست في الصفحة الرئيسية')});return loadHome()}).catch(fail);return false},c?null:tr('Add category','إضافة الفئة'),
     c?'<button type="button" class="btn btn-d" id="m-del" style="margin-inline-end:auto">'+ic('trash')+tr('Delete','حذف')+'</button>':'');
   if(c)$('#m-del').onclick=()=>{if(confirm(tr('Delete this category? Products stay, only the category is removed.','حذف هذه الفئة؟ تبقى المنتجات وتُحذف الفئة فقط.'))){closeModal();homeDo('/alihsan/dashboard/category/action',{category_id:c.id,action:'delete'},tr('Category deleted','تم حذف الفئة'))}}},
 catMove:d=>homeDo('/alihsan/dashboard/category/action',{category_id:+d.id,action:d.dir}),
 newsEdit:d=>{const n=d.id?HOME.news.find(x=>x.id===+d.id):null;
   modal(n?tr('Edit story','تعديل الخبر'):tr('New story','خبر جديد'),newsForm(n),f=>{
     const name=f.get('name').trim(),active=!!f.get('active'),featured=!!f.get('featured'),body=f.get('body');
     const vals={name,summary:f.get('summary'),tag:f.get('tag').trim(),date:f.get('date'),link_url:f.get('link').trim(),link_new_tab:!!f.get('new_tab'),featured,active};
     if(body.trim()!==(n?.body||'').trim())vals.body=body;
     saving(readFile(f.get('image')).then(image=>rpc('/alihsan/dashboard/news/save',{post_id:n?n.id:null,image,vals})))
     .then(()=>{closeModal();
       toast(n?tr('Story updated','تم تحديث الخبر'):tr('Story added','تمت إضافة الخبر'),{sub:!active?tr('Hidden — switch “Published” on to show it.','مخفي — فعّل “منشور” لعرضه.'):featured?tr('Shown large at the top of the news list','يظهر بحجم كبير أعلى قائمة الأخبار'):tr('Live in the Media Center news list','منشور في قائمة أخبار المركز الإعلامي')});return loadHome()}).catch(fail);return false},n?null:tr('Add story','إضافة الخبر'),
     n?'<button type="button" class="btn btn-d" id="m-del" style="margin-inline-end:auto">'+ic('trash')+tr('Delete','حذف')+'</button>':'');
   if(n)$('#m-del').onclick=()=>{if(confirm(tr('Delete this story?','حذف هذا الخبر؟'))){closeModal();homeDo('/alihsan/dashboard/news/action',{post_id:n.id,action:'delete'},tr('Story deleted','تم حذف الخبر'))}}},
 mcEdit:d=>{const kind=d.kind,K=MC[kind],x=d.id?HOME[kind].find(y=>y.id===+d.id):null;
   modal(x?tr('Edit '+K.one[0].toLowerCase(),'تعديل '+K.one[1]):tr(K.add[0],K.add[1]),mcForm(kind,x),f=>{
     const vals=mcVals(kind,f);
     if(kind==='images'&&!x&&!f.get('image')?.size&&!f.getAll('photos').some(p=>p.size)){toast(tr('Add a cover image or some photos','أضف صورة غلاف أو بعض الصور'),{type:'err'});return false}
     saving(Promise.all([readFile(f.get('image')),Promise.all(f.getAll('photos').map(readFile))]).then(([image,photos])=>rpc('/alihsan/dashboard/media_center/save',{kind,rec_id:x?x.id:null,vals,image,photos:photos.filter(Boolean),remove_photo_ids:f.getAll('rmp').map(Number)})))
     .then(()=>{closeModal();toast(x?tr(K.one[0]+' updated',K.one[1]+' — تم التحديث'):tr(K.one[0]+' added',K.one[1]+' — تمت الإضافة'),{sub:vals.active?tr('Live in the Media Center','منشور في المركز الإعلامي'):tr('Hidden — switch “Published” on to show it.','مخفي — فعّل “منشور” لعرضه.')});return loadHome()}).catch(fail);return false},x?null:tr(K.add[0],K.add[1]),
     x?'<button type="button" class="btn btn-d" id="m-del" style="margin-inline-end:auto">'+ic('trash')+tr('Delete','حذف')+'</button>':'');
   if(x)$('#m-del').onclick=()=>{if(confirm(tr('Delete “'+x.name+'”?','حذف “'+x.name+'”؟'))){closeModal();homeDo('/alihsan/dashboard/media_center/action',{kind,rec_id:x.id,action:'delete'},tr(K.one[0]+' deleted',K.one[1]+' — تم الحذف'))}}},
 popupEdit:()=>{const P=HOME.popup;
   modal(tr('Edit home popup','تعديل النافذة المنبثقة'),popupForm(P),f=>{
     const active=!!f.get('active'),amounts=f.get('amounts').trim();
     if(amounts&&!/^\s*\d+(\s*,\s*\d+)*\s*,?\s*$/.test(amounts)){toast(tr('Amounts must be whole numbers separated by commas','يجب أن تكون المبالغ أرقامًا صحيحة مفصولة بفواصل'),{type:'err'});return false}
     saving(readFile(f.get('image')).then(image=>rpc('/alihsan/dashboard/popup/save',{image,remove_image:!!f.get('rm'),
       vals:{ih_popup_active:active,ih_popup_product_id:+f.get('product')||false,ih_popup_eyebrow:f.get('eyebrow').trim(),ih_popup_title:f.get('title').trim(),ih_popup_description:f.get('description'),
         ih_popup_amounts:amounts,ih_popup_default_amount:+f.get('default')||0,ih_popup_explore_url:f.get('explore').trim(),ih_popup_frequency:f.get('frequency'),ih_popup_delay:Math.max(0,Math.min(60,+f.get('delay')||0))},
       product_vals:{ih_goal_amount:+f.get('goal')||0,ih_raised_offline:+f.get('offline')||0}})))
     .then(()=>{closeModal();toast(tr('Popup saved','تم حفظ النافذة'),{sub:active?tr('Shown over the home page','تظهر فوق الصفحة الرئيسية'):tr('Off — switch “Show the popup” on to show it.','متوقفة — فعّل “إظهار النافذة” لعرضها.')});return loadHome()}).catch(fail);return false},tr('Save popup','حفظ النافذة'))},
 newsFeature:d=>homeDo('/alihsan/dashboard/news/action',{post_id:+d.id,action:d.on==='1'?'unfeature':'feature'},d.on==='1'?tr('Story no longer featured','لم يعد الخبر مميزًا'):tr('Story featured at the top of the news list','أصبح الخبر مميزًا أعلى قائمة الأخبار'))
});
const download=(name,rows)=>{const csv='﻿'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=name;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)};

/* redraw the trend chart when the card width changes */
let rzT;addEventListener('resize',()=>{clearTimeout(rzT);rzT=setTimeout(drawTrend,150)});
/* ---------- start ---------- */
const startLang=store.get('lang','en');
if(startLang==='ar')setLang('ar');else{drawNav();drawNotes();render()}
})();
