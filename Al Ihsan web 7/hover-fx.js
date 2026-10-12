(()=>{
const SKIP='header,.topline,.gl-lb,dialog,[role=dialog],.modal,.pj-banner,.campaign-slides,.campaign-hero,.pj-stage,.logo,.ft-logo,.hv-skip';
/* append a property to an element's existing transition list instead of replacing it */
const addT=(el,prop,dur='.5s',ease='ease')=>{
  const cs=getComputedStyle(el);
  const props=cs.transitionProperty.split(',').map(s=>s.trim());
  if(props.includes(prop)||props.includes('all'))return;
  const none=props.length===1&&props[0]==='all'&&cs.transitionDuration==='0s';
  const d=cs.transitionDuration.split(',').map(s=>s.trim()),e=cs.transitionTimingFunction.split(',').map(s=>s.trim()),dl=cs.transitionDelay.split(',').map(s=>s.trim());
  const list=props.map((p,i)=>p+' '+d[i%d.length]+' '+e[i%e.length]+' '+dl[i%dl.length]);
  el.style.transition=(none?[]:list).concat(prop+' '+dur+' '+ease).join(', ');
};
const images=()=>{
  document.querySelectorAll('img').forEach(img=>{
    if(img.dataset.hv||img.closest(SKIP)||img.closest('footer,nav,.mega-panel,.pj-dots'))return;
    const p=img.parentElement;if(!p||p===document.body)return;
    img.dataset.hv='1';
    const ir=img.getBoundingClientRect();if(ir.width&&ir.width<70)return;
    const pr=p.getBoundingClientRect(),pcs=getComputedStyle(p);
    const fills=!ir.width||(pr.width-ir.width<24&&pr.height-ir.height<24)||pcs.overflow==='hidden';
    if(!fills||pcs.display==='inline')return;
    img.classList.add('hv-img');addT(img,'scale','.6s','cubic-bezier(.22,.7,.2,1)');
    if(!p.classList.contains('hv-wrap')){p.classList.add('hv-wrap');if(pcs.position==='static')p.style.position='relative';
      const s=document.createElement('i');s.className='hv-shine';s.setAttribute('aria-hidden','true');p.appendChild(s)}
  });
};
const cards=()=>{
  document.querySelectorAll('.sf,.fade,.reveal,[class*=card]').forEach(el=>{
    if(el.dataset.hvc||el.closest(SKIP)||el.closest('footer,.mega-panel'))return;
    const cs=getComputedStyle(el),r=el.getBoundingClientRect();
    if(r.width<140||r.width>760||r.height<80||r.height>900)return;
    const box=parseFloat(cs.borderTopWidth)>0||cs.boxShadow!=='none'||/rgba?\((?!0, 0, 0, 0)/.test(cs.backgroundColor)&&cs.backgroundColor!=='rgba(0, 0, 0, 0)';
    if(!box)return;
    el.dataset.hvc='1';el.classList.add('hv-card');addT(el,'translate','.35s','cubic-bezier(.22,.7,.2,1)');addT(el,'box-shadow','.35s');
  });
};
const buttons=()=>{
  document.querySelectorAll('main a[class*=btn],main button:not(.pj-arrow):not([class*=dot]):not(.gl-x):not(.gl-a),main a[class*=hero],main .pp-sel,main .ar-apply,main .ar-follow,.ft-btn').forEach(el=>{
    if(el.dataset.hvb||el.closest(SKIP)||el.closest('.pj-tabs-wrap,.gl-pager,.pp-pager,.pp-steps'))return;
    el.dataset.hvb='1';el.classList.add('hv-btn');addT(el,'translate','.25s');addT(el,'filter','.25s');addT(el,'scale','.15s');
    if(getComputedStyle(el).position==='static')el.style.position='relative';
    if(getComputedStyle(el).overflow==='visible')el.style.overflow='hidden';
    el.addEventListener('pointerdown',e=>{const r=el.getBoundingClientRect(),s=Math.max(r.width,r.height)*2,i=document.createElement('span');i.className='hv-rip';i.style.cssText='width:'+s+'px;height:'+s+'px;left:'+(e.clientX-r.left-s/2)+'px;top:'+(e.clientY-r.top-s/2)+'px';el.appendChild(i);setTimeout(()=>i.remove(),650)});
  });
};
const run=()=>{try{images();cards();buttons()}catch(e){}};
addEventListener('load',()=>{run();setTimeout(run,900);setTimeout(run,2200)});
if(document.readyState!=='loading')run();else addEventListener('DOMContentLoaded',run);
let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(run,350)}).observe(document.body,{childList:true,subtree:true});
})();
