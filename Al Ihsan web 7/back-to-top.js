(()=>{
const b=document.createElement('button');
b.className='btt';b.type='button';
b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
const L=()=>document.documentElement.lang==='ar';
const lab=()=>b.setAttribute('aria-label',L()?'العودة للأعلى':'Back to top');
lab();new MutationObserver(lab).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
b.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
const t=()=>b.classList.toggle('on',scrollY>400);
addEventListener('scroll',t,{passive:true});t();
document.body.appendChild(b);
})();
