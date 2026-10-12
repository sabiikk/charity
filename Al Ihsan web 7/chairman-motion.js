(()=>{
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
/* wrap the sidebar photo so it can zoom inside its rounded frame */
$$('.chair-aside-card>img').forEach(i=>{const w=document.createElement('span');w.className='cm-frame';i.replaceWith(w);w.appendChild(i)});
/* what animates, how, and in what order */
const set=(sel,kind,start=0,step=.1,root=document)=>$$(sel,root).forEach((e,i)=>{e.dataset.cm=kind;e.style.setProperty('--cm-d',(start+i*step).toFixed(2)+'s')});
set('.chair-hero-copy>.chair-kicker','up',.05);
set('.chair-hero-copy>div:not(.chair-kicker):not(.chair-signature):not(.chair-hero-actions)','up',.18);
set('.chair-hero-copy>.chair-signature','up',.32);
set('.chair-hero-copy>.chair-hero-actions','up',.44);
set('.chair-hero-portrait','right',.2);
set('.chair-hero-card','up',.8);
set('.chair-aside-card','left',0);
set('.chair-aside-links a','left',.15,.09);
set('.chair-article>*','up',.05,.12);
set('.chair-next-card','up',0,.16);
const items=$$('[data-cm]');
document.documentElement.classList.add('cm-on');
const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const t=e.target;io.unobserve(t);
  t.classList.add('cm-in');
  /* once finished, drop the reveal state so normal hover effects take over */
  const d=parseFloat(t.style.getPropertyValue('--cm-d'))||0;
  setTimeout(()=>{t.removeAttribute('data-cm');t.classList.remove('cm-in');t.style.removeProperty('--cm-d')},(d+1.1)*1000);
}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
items.forEach(e=>io.observe(e));
/* portrait: image drifts with the cursor */
const p=document.querySelector('.chair-hero-portrait');
if(p&&matchMedia('(hover:hover) and (pointer:fine)').matches){
  p.addEventListener('pointermove',e=>{const r=p.getBoundingClientRect();p.style.setProperty('--mx',((e.clientX-r.left)/r.width-.5).toFixed(3));p.style.setProperty('--my',((e.clientY-r.top)/r.height-.5).toFixed(3))});
  p.addEventListener('pointerleave',()=>{p.style.setProperty('--mx',0);p.style.setProperty('--my',0)});
}
})();
