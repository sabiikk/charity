(()=>{
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const root=document.documentElement;root.classList.add('sf-on');
const SKIP='header,.topline,footer,nav,.mega-panel,dialog,.gl-lb,.modal,[role=dialog],.pj-tabs-wrap,.sf-skip,script,style,noscript';
const bad=el=>{if(el.nodeType!==1||el.matches(SKIP)||el.closest(SKIP))return true;const cs=getComputedStyle(el);return cs.position==='fixed'||cs.position==='sticky'||cs.display==='none'||cs.display==='contents'};
const io=new IntersectionObserver(es=>es.forEach(e=>{
  const t=e.target,on=e.isIntersecting;
  if(t.classList.contains('sf'))t.classList.toggle('sf-in',on);
  else if(t.dataset.sfv)t.classList.toggle('visible',on);
}),{threshold:0,rootMargin:'0px 0px -8% 0px'});
const add=(el,delay)=>{
  if(el.dataset.sf||bad(el))return;
  const r=el.getBoundingClientRect();if(el.offsetParent===null&&getComputedStyle(el).position!=='fixed'){}
  el.dataset.sf='1';
  if(el.classList.contains('fade')||el.classList.contains('visible')&&el.dataset.sfv){el.dataset.sfv='1';io.observe(el);return}
  if(el.classList.contains('fade')){el.dataset.sfv='1';io.observe(el);return}
  if(delay!=null&&!el.style.getPropertyValue('--sfd'))el.style.setProperty('--sfd',delay+'s');
  el.classList.add('sf');io.observe(el)};
const scan=()=>{
  const tops=[...document.querySelectorAll('main > *, body > section, body > div')];
  tops.forEach(t=>{
    if(t.classList.contains('fade')){if(!t.dataset.sf&&!bad(t)){t.dataset.sf='1';t.dataset.sfv='1';io.observe(t)}}
    else add(t);
    /* repeated items inside grids / wrapped flex rows */
    const walk=(p,depth)=>{
      if(depth>4)return;
      const cs=getComputedStyle(p),kids=[...p.children].filter(k=>!bad(k));
      const rep=(cs.display.includes('grid')&&kids.length>=2)||(cs.display.includes('flex')&&cs.flexWrap!=='nowrap'&&kids.length>=3)||(cs.display.includes('flex')&&cs.flexDirection.startsWith('row')&&kids.length>=3&&depth>0);
      if(rep)kids.forEach((k,i)=>{const r=k.getBoundingClientRect();if(r.width>60&&r.height>30){if(k.classList.contains('fade')){if(!k.dataset.sf){k.dataset.sf='1';k.dataset.sfv='1';io.observe(k)}}else add(k,Math.min(i%4,3)*.1)}});
      kids.forEach(k=>walk(k,depth+1));
    };
    if(!bad(t))walk(t,0);
  });
};
const run=()=>{try{scan()}catch(e){}};
(document.readyState==='loading'?addEventListener.bind(window,'DOMContentLoaded'):f=>f())(run);
addEventListener('load',()=>{run();setTimeout(run,700);setTimeout(run,1800)});
let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(run,300)}).observe(document.body,{childList:true,subtree:true});
})();
