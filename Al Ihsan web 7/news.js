document.documentElement.classList.add('js');
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.1,rootMargin:'0px 0px -40px 0px'});
$$('.fade').forEach(e=>io.observe(e));
/* banner rotator */
const fg=$$('.pj-banner img'),dots=$$('.pj-dots i');let n=0,timer;
const show=i=>{n=(i+fg.length)%fg.length;fg.forEach((x,k)=>x.classList.toggle('on',k===n));dots.forEach((x,k)=>x.classList.toggle('on',k===n));clearTimeout(timer);timer=setTimeout(()=>show(n+1),4500)};
if(fg.length){dots.forEach((d,i)=>d.addEventListener('click',()=>show(i)));$('.pj-prev').addEventListener('click',()=>show(n-1));$('.pj-next').addEventListener('click',()=>show(n+1));show(0)}
/* filter + search */
const items=$$('.nw-feat,.nw-card'),empty=$('.nw-empty'),q=$('#nw-q');let cat='all';
const render=()=>{const t=q.value.trim().toLowerCase();let shown=0;
  items.forEach(c=>{const ok=(cat==='all'||c.dataset.cat===cat)&&(!t||(c.textContent+' '+$$('[data-ar]',c).map(x=>x.dataset.ar).join(' ')).toLowerCase().includes(t));c.hidden=!ok;
    if(ok){c.classList.remove('visible');c.style.setProperty('--d',Math.min(shown,5)*.08+'s');shown++;requestAnimationFrame(()=>requestAnimationFrame(()=>io.observe(c)))}});
  empty.hidden=shown>0};
$$('.nw-chip').forEach(b=>b.addEventListener('click',()=>{cat=b.dataset.cat;$$('.nw-chip').forEach(x=>x.classList.toggle('selected',x===b));render()}));
q.addEventListener('input',render);
/* language + mobile menu */
$$('[data-ar]').forEach(e=>e.dataset.en=e.innerHTML);
$('#language').addEventListener('click',e=>{const ar=document.documentElement.lang!=='ar';document.documentElement.lang=ar?'ar':'en';document.documentElement.dir=ar?'rtl':'ltr';$$('[data-ar]').forEach(x=>x.innerHTML=x.dataset[ar?'ar':'en']);e.target.textContent=ar?'English':'العربية';e.target.lang=ar?'en':'ar';q.placeholder=ar?q.dataset.arPh:'Search news…'});
const menu=$('.menu');menu.addEventListener('click',()=>{const o=$('nav').classList.toggle('open');menu.setAttribute('aria-expanded',String(o))});
/* filter strip arrows */
(()=>{const c=$('.nw-chips'),p=$('.nw-ar.prev'),n=$('.nw-ar.next');if(!c||!p||!n)return;const rt=()=>document.documentElement.dir==='rtl';
const upd=()=>{const max=c.scrollWidth-c.clientWidth,x=Math.abs(c.scrollLeft),a=x<4,b=x>max-4;const fit=max<=4;p.disabled=!fit&&(rt()?b:a);n.disabled=!fit&&(rt()?a:b)};
p.addEventListener('click',()=>c.scrollBy({left:rt()?200:-200}));n.addEventListener('click',()=>c.scrollBy({left:rt()?-200:200}));
c.addEventListener('scroll',upd);addEventListener('resize',upd);setTimeout(upd,80);upd();
$$('.nw-chip').forEach(b=>b.addEventListener('click',()=>b.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'})))})();
