(()=>{
const wrap=document.querySelector('.cat-wrap');if(!wrap)return;
const track=wrap.querySelector('.cat-track'),prev=wrap.querySelector('.prev'),next=wrap.querySelector('.next');
const cards=[...track.querySelectorAll('.cat-card')];
const rtl=()=>document.documentElement.dir==='rtl';
const step=()=>{const c=cards[0];return(c?c.getBoundingClientRect().width:200)+parseFloat(getComputedStyle(track).columnGap||0)};
let restart=()=>{};
const max=()=>track.scrollWidth-track.clientWidth;
const pos=()=>Math.abs(track.scrollLeft);
const go=x=>track.scrollTo({left:(rtl()?-1:1)*Math.max(0,Math.min(x,max()))});
const upd=()=>{const x=pos(),m=max(),s=x<6,e=x>m-6;prev.disabled=rtl()?e:s;next.disabled=rtl()?s:e;};
prev.addEventListener('click',()=>{go(pos()-step());restart()});
next.addEventListener('click',()=>{go(pos()+step());restart()});
track.addEventListener('scroll',upd,{passive:true});addEventListener('resize',upd);setTimeout(upd,80);upd();
// autoplay: one card every 3s, loops back to the start; pauses on hover, touch, keyboard focus, off-screen or hidden tab
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
let timer,hold=false,seen=true;
const tick=()=>{if(hold||!seen||document.hidden)return;pos()>=max()-6?go(0):go(pos()+step())};
restart=()=>{clearInterval(timer);timer=setInterval(tick,3000)};
const section=wrap.closest('.cat-carousel')||wrap;
section.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')hold=true});
section.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){hold=false;restart()}});
track.addEventListener('touchstart',()=>{hold=true},{passive:true});
track.addEventListener('touchend',()=>{setTimeout(()=>{hold=false;restart()},1500)},{passive:true});
section.addEventListener('focusin',()=>{hold=true});
section.addEventListener('focusout',e=>{if(!section.contains(e.relatedTarget)){hold=false;restart()}});
new IntersectionObserver(es=>{seen=es[0].isIntersecting}).observe(section);
restart();
})();
