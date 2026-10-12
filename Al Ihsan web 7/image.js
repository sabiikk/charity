document.documentElement.classList.add('js');
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.1,rootMargin:'0px 0px -40px 0px'});
$$('.fade').forEach(e=>io.observe(e));
const rtl=()=>document.documentElement.lang==='ar';
/* banner rotator */
const fg=$$('.pj-banner img'),dots=$$('.pj-dots i');let n=0,timer;
const show=i=>{n=(i+fg.length)%fg.length;fg.forEach((x,k)=>x.classList.toggle('on',k===n));dots.forEach((x,k)=>x.classList.toggle('on',k===n));clearTimeout(timer);timer=setTimeout(()=>show(n+1),4500)};
if(fg.length){dots.forEach((d,i)=>d.addEventListener('click',()=>show(i)));$('.pj-prev').addEventListener('click',()=>show(n-1));$('.pj-next').addEventListener('click',()=>show(n+1));show(0)}
/* filter, search, pagination */
const cards=$$('.gl-card'),PER=6,pager=$('#gl-pager'),empty=$('#gl-empty'),q=$('#gl-q'),year=$('#gl-year');let page=1,match=[];
const render=(anim=true)=>{
  const t=q.value.trim().toLowerCase(),y=year.value;
  match=cards.filter(c=>(y==='all'||c.dataset.year===y)&&(!t||c.dataset.t.includes(t)||c.dataset.ta.includes(t)));
  const pages=Math.max(1,Math.ceil(match.length/PER));page=Math.min(page,pages);
  cards.forEach(c=>c.hidden=true);
  match.slice((page-1)*PER,page*PER).forEach((c,i)=>{c.hidden=false;if(anim){c.classList.remove('visible');c.style.transitionDelay=(i%3)*.1+'s';requestAnimationFrame(()=>requestAnimationFrame(()=>io.observe(c)))}});
  empty.hidden=match.length>0;
  pager.hidden=pages<2;
  pager.innerHTML='<button data-p="prev" aria-label="Previous page"'+(page===1?' disabled':'')+'>'+(rtl()?'›':'‹')+'</button>'+Array.from({length:pages},(_,i)=>'<button data-p="'+(i+1)+'"'+(i+1===page?' class="on" aria-current="page"':'')+'>'+(i+1)+'</button>').join('')+'<button data-p="next" aria-label="Next page"'+(page===pages?' disabled':'')+'>'+(rtl()?'‹':'›')+'</button>';
};
pager.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const p=b.dataset.p;page=p==='prev'?page-1:p==='next'?page+1:+p;render();$('#galleries').scrollIntoView({behavior:'smooth'})});
q.addEventListener('input',()=>{page=1;render()});year.addEventListener('change',()=>{page=1;render()});
const fb=$('#gl-fbtn'),pop=$('#gl-pop');fb.addEventListener('click',()=>{pop.hidden=!pop.hidden;fb.setAttribute('aria-expanded',String(!pop.hidden))});
document.addEventListener('click',e=>{if(!e.target.closest('.gl-filter')){pop.hidden=true;fb.setAttribute('aria-expanded','false')}});
render(false);cards.slice(0,PER).forEach(c=>c.classList.contains('fade')&&io.observe(c));
/* lightbox over all matching galleries */
const lb=$('#gl-lb'),lim=$('img',lb),cap=$('figcaption',lb);let cur=0;
const open=i=>{cur=(i+match.length)%match.length;const c=match[cur];lim.src=$('img',c).src;lim.alt=$('img',c).alt;const ar=rtl();cap.innerHTML=(ar?$('h3',c).dataset.ar:$('h3',c).dataset.en||$('h3',c).textContent)+'<small>'+(cur+1)+' / '+match.length+'</small>';lb.hidden=false;document.body.style.overflow='hidden'};
const close=()=>{lb.hidden=true;document.body.style.overflow=''};
cards.forEach(c=>$('.gl-img',c).addEventListener('click',()=>open(match.indexOf(c))));
$('.gl-x',lb).addEventListener('click',close);$('.gl-a.prev',lb).addEventListener('click',()=>open(cur-1));$('.gl-a.next',lb).addEventListener('click',()=>open(cur+1));
lb.addEventListener('click',e=>{if(e.target===lb)close()});
document.addEventListener('keydown',e=>{if(lb.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowRight')open(cur+(rtl()?-1:1));if(e.key==='ArrowLeft')open(cur+(rtl()?1:-1))});
/* language + mobile menu */
$$('[data-ar]').forEach(e=>e.dataset.en=e.innerHTML);
$('#language').addEventListener('click',e=>{const ar=document.documentElement.lang!=='ar';document.documentElement.lang=ar?'ar':'en';document.documentElement.dir=ar?'rtl':'ltr';$$('[data-ar]').forEach(x=>x.innerHTML=x.dataset[ar?'ar':'en']);e.target.textContent=ar?'English':'العربية';e.target.lang=ar?'en':'ar';q.placeholder=ar?q.dataset.arPh:'Type a keyword';render(false);cards.forEach(c=>c.classList.add('visible'))});
const menu=$('.menu');menu.addEventListener('click',()=>{const o=$('nav').classList.toggle('open');menu.setAttribute('aria-expanded',String(o))});
