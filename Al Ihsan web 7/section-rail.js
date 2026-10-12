// Home: fixed section rail — a frosted pill of icons; a green thumb slides to the current section's icon and its name shows beside it
(()=>{
const I=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const stops=[
 {sel:'.campaign-hero',en:'Home',ar:'الرئيسية',icon:I('<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>')},
 {sel:'.cat-carousel',en:'Our Projects',ar:'مشاريعنا',icon:I('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>')},
 {sel:'#causes',en:'Featured Projects',ar:'مشاريع مميزة',icon:I('<path d="m6 4.5.9 1.8 2 .3-1.45 1.4.35 2L6 9.05l-1.8.95.35-2L3.1 6.6l2-.3z"/><path d="m6 13.5.9 1.8 2 .3-1.45 1.4.35 2L6 18.05l-1.8.95.35-2L3.1 15.6l2-.3z"/><path d="M12 6h9M12 9h6M12 15h9M12 18h6"/>')},
 {sel:'#ways',en:'Donate & Other',ar:'التبرع وغيره',icon:I('<path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16"/><path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 15 6 6"/><path d="M19.5 8.5c.7-.7 1.5-1.6 1.5-2.7A2.73 2.73 0 0 0 16 4a2.78 2.78 0 0 0-5 1.8c0 1.2.8 2 1.5 2.8L16 12Z"/>')},
 {sel:'#media-highlights',en:'Media',ar:'المركز الإعلامي',icon:I('<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>')},
 {sel:'#partners',en:'Partners',ar:'شركاؤنا',icon:I('<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>')},
].map(s=>({...s,el:document.querySelector(s.sel)})).filter(s=>s.el);
if(stops.length<2)return;
const ar=()=>document.documentElement.lang==='ar';
const nav=document.createElement('nav');nav.className='sec-rail';nav.setAttribute('aria-label','Page sections');
nav.innerHTML='<span class="sec-thumb" aria-hidden="true"></span>'+stops.map((s,i)=>`<a href="#" class="sec-dot" data-i="${i}">${s.icon}<span class="sec-tag"></span></a>`).join('');
document.body.append(nav);
const links=[...nav.querySelectorAll('.sec-dot')],thumb=nav.querySelector('.sec-thumb');
const label=()=>{nav.setAttribute('aria-label',ar()?'أقسام الصفحة':'Page sections');links.forEach((a,i)=>{const t=ar()?stops[i].ar:stops[i].en;a.querySelector('.sec-tag').textContent=t;a.setAttribute('aria-label',t)})};
label();new MutationObserver(label).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
const headH=()=>{const h=document.querySelector('body>header');return h?h.getBoundingClientRect().height:0};
links.forEach((a,i)=>a.addEventListener('click',e=>{e.preventDefault();const y=i===0?0:stops[i].el.getBoundingClientRect().top+scrollY-headH()-12;scrollTo({top:y,behavior:'smooth'})}));
// active = last section whose top has passed 40% of the viewport
let cur=-1,raf=0;
const spy=()=>{raf=0;const line=innerHeight*.4;let k=0;stops.forEach((s,i)=>{if(s.el.getBoundingClientRect().top<=line)k=i});
  if(k!==cur){cur=k;links.forEach((a,i)=>{a.classList.toggle('on',i===k);i===k?a.setAttribute('aria-current','true'):a.removeAttribute('aria-current')})}
  thumb.style.transform=`translateY(${links[k].offsetTop}px)`;
  // step aside once the footer area is reached so it never sits over the footer
  const f=document.querySelector('.connect,footer');nav.classList.toggle('away',!!f&&f.getBoundingClientRect().top<innerHeight*.75)};
addEventListener('scroll',()=>{raf||(raf=requestAnimationFrame(spy))},{passive:true});addEventListener('resize',spy);spy();
})();
