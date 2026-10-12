document.documentElement.classList.add('js');
/* fade on scroll */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -40px 0px'});
const watch=r=>(r||document).querySelectorAll('.fade:not(.visible)').forEach(e=>io.observe(e));
watch();
/* banner rotator */
const fg=[...document.querySelectorAll('.pj-banner img')],dots=[...document.querySelectorAll('.pj-dots i')];let n=0,timer;
const show=i=>{n=(i+fg.length)%fg.length;fg.forEach((x,k)=>x.classList.toggle('on',k===n));dots.forEach((x,k)=>x.classList.toggle('on',k===n));clearTimeout(timer);timer=setTimeout(()=>show(n+1),4500)};
if(fg.length){dots.forEach((d,i)=>d.addEventListener('click',()=>show(i)));document.querySelector('.pj-prev').addEventListener('click',()=>show(n-1));document.querySelector('.pj-next').addEventListener('click',()=>show(n+1));show(0)}
/* tabs */
const tabs=document.querySelector('.pj-tabs'),prev=document.querySelector('.pj-arrow.prev'),next=document.querySelector('.pj-arrow.next');
const rtl=()=>document.documentElement.dir==='rtl';
const upd=()=>{const max=tabs.scrollWidth-tabs.clientWidth,x=Math.abs(tabs.scrollLeft);const atStart=x<4,atEnd=x>max-4;prev.disabled=rtl()?atEnd:atStart;next.disabled=rtl()?atStart:atEnd};
prev.addEventListener('click',()=>tabs.scrollBy({left:rtl()?250:-250}));next.addEventListener('click',()=>tabs.scrollBy({left:rtl()?-250:250}));tabs.addEventListener('scroll',upd);addEventListener('resize',upd);addEventListener('load',upd);document.fonts&&document.fonts.ready.then(upd);upd();
const cards=[...document.querySelectorAll('.pj-card')],empty=document.querySelector('.pj-empty'),countEl=document.querySelector('.pj-count'),q=document.querySelector('#pj-q');
const svg=d=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';
const ICONS={all:svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),endowment:svg('<path d="M3 21h18M5 21V10l7-6 7 6v11M9 21v-6h6v6"/>'),general:svg('<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.500-7 10-7 10z"/>'),seasonal:svg('<path d="M20 14.5A8 8 0 1 1 9.500 4a6.500 6.500 0 0 0 10.500 10.500z"/>'),campaigns:svg('<path d="M3 11v3l12 5V6zM15 9a3 3 0 0 1 0 6M6 14l1.500 6h3L9 15"/>'),initiatives:svg('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.6.5 1 1.200 1 2V16h5v-.1c0-.8.4-1.500 1-2A6 6 0 0 0 12 3z"/>'),hospital:svg('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>'),sponsor:svg('<circle cx="9" cy="8" r="3.500"/><path d="M2.500 20c0-4 3-6 6.500-6s6.500 2 6.500 6M17 4.500a3.500 3.500 0 0 1 0 7M21.500 20c0-3-1.500-5-4-5.700"/>')};
document.querySelectorAll('.pj-tab').forEach(t=>{const k=t.dataset.cat,n=k==='all'?cards.length:cards.filter(c=>c.dataset.cat===k).length;const ar=t.dataset.ar;t.removeAttribute('data-ar');t.innerHTML='<span class="ti">'+(ICONS[k]||'')+'</span><span class="tl" data-ar="'+ar+'">'+t.textContent+'</span><span class="tn">'+n+'</span>'});
let cat='all';
const lang=()=>document.documentElement.lang==='ar';
const render=(anim=true)=>{
  const term=q.value.trim().toLowerCase();let shown=0;
  cards.forEach(c=>{const text=(c.textContent+' '+(c.querySelector('h3 [data-ar]').dataset.ar||'')).toLowerCase();const ok=term?text.includes(term):(cat==='all'||c.dataset.cat===cat);c.hidden=!ok;
    if(ok){c.classList.remove('visible');c.style.setProperty('--d',Math.min(shown,5)*.1+'s');shown++;if(anim)requestAnimationFrame(()=>requestAnimationFrame(()=>io.observe(c)));else c.classList.add('visible')}});
  empty.hidden=shown>0;
  countEl.textContent=term?(lang()?shown+' نتيجة':shown+' result'+(shown===1?'':'s')+' found'):'';
  document.querySelectorAll('.pj-tab').forEach(x=>{const on=!term&&x.dataset.cat===cat;x.classList.toggle('selected',on);x.setAttribute('aria-selected',String(on))});
};
document.querySelectorAll('.pj-tab').forEach(t=>t.addEventListener('click',()=>{cat=cat===t.dataset.cat?'all':t.dataset.cat;q.value='';render();t.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'})}));
q.addEventListener('input',()=>render());
render();
/* shadow once the bar sticks */
const wrap=document.querySelector('.pj-tabs-wrap');addEventListener('scroll',()=>wrap.classList.toggle('stuck',wrap.getBoundingClientRect().top<=1),{passive:true});
/* cart */
const count=document.querySelector('#basket-count');
document.querySelectorAll('.pj-cart').forEach(b=>b.addEventListener('click',()=>{const c=b.closest('.pj-card'),h=c.querySelector('h3 [data-ar]'),inp=c.querySelector('.pj-amount input');window.IhsanCart&&IhsanCart.add({en:h.dataset.en||h.textContent,ar:h.dataset.ar||h.textContent,amount:Number(inp&&inp.value)||10})}));
/* language + mobile menu */
document.querySelectorAll('[data-ar]').forEach(e=>e.dataset.en=e.innerHTML);
document.querySelector('#language').addEventListener('click',e=>{const ar=document.documentElement.lang!=='ar';document.documentElement.lang=ar?'ar':'en';document.documentElement.dir=ar?'rtl':'ltr';document.querySelectorAll('[data-ar]').forEach(x=>x.innerHTML=x.dataset[ar?'ar':'en']);e.target.textContent=ar?'English':'العربية';e.target.lang=ar?'en':'ar';q.placeholder=ar?q.dataset.arPh:'Search projects…';render(false);upd()});
const menu=document.querySelector('.menu');menu.addEventListener('click',()=>{const o=document.querySelector('nav').classList.toggle('open');menu.setAttribute('aria-expanded',String(o))});
/* mouse wheel scrolls the tab strip sideways when it overflows */
tabs.addEventListener('wheel',e=>{if(tabs.scrollWidth<=tabs.clientWidth||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;const atEdge=(e.deltaY<0&&tabs.scrollLeft<=0)||(e.deltaY>0&&tabs.scrollLeft>=tabs.scrollWidth-tabs.clientWidth-1);if(atEdge)return;e.preventDefault();tabs.scrollBy({left:e.deltaY,behavior:'auto'})},{passive:false});

/* open the category named in the link, e.g. ?cat=hospital */
{const qc=new URLSearchParams(location.search).get('cat'),qt=qc&&document.querySelector('.pj-tab[data-cat="'+qc+'"]');if(qt)setTimeout(()=>{qt.click();const w=document.querySelector('.pj-tabs-wrap');w&&w.scrollIntoView({behavior:'smooth',block:'start'})},350)}

/* project cards: image pops up each time a card scrolls into view */
(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;
const pop=new IntersectionObserver(es=>es.forEach(e=>{const c=e.target;if(e.intersectionRatio>=.25)c.classList.add('pj-pop');else if(!e.isIntersecting)c.classList.remove('pj-pop')}),{threshold:[0,.25]});
document.querySelectorAll('.pj-card').forEach(c=>pop.observe(c));})();
