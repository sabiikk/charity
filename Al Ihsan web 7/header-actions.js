(()=>{
const box=document.querySelector('body>header .header-actions');if(!box)return;
const KEY='ihsan-concept2-basket';
const isIndex=!!document.querySelector('#basket-dialog');
const ar=()=>document.documentElement.lang==='ar'?1:0;
const t=(en,a)=>ar()?a:en;
/* ---------- shared cart store (same key the home page already uses) ---------- */
const read=()=>{try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch{return[]}};
const write=a=>{try{localStorage.setItem(KEY,JSON.stringify(a))}catch{}};
const listeners=[];
window.IhsanCart={items:read,add(item){const a=read();a.push(Object.assign({en:'Donation',ar:'تبرع',amount:10},item));write(a);listeners.forEach(f=>f(true))},remove(i){const a=read();a.splice(i,1);write(a);listeners.forEach(f=>f(false))},set(i,amount){const a=read();if(!a[i])return;a[i].amount=amount;write(a);listeners.forEach(f=>f(false))},on(f){listeners.push(f)}};
const money=n=>(Number(n)||0).toLocaleString('en-US')+' AED';
/* ---------- 1. language switch ---------- */
const orig=box.querySelector('#language');
if(orig){
  const sw=document.createElement('div');sw.className='ha-lang';sw.setAttribute('role','group');sw.setAttribute('aria-label','Language');
  sw.innerHTML='<span class="ha-thumb"></span><button type="button" data-l="en" lang="en">EN</button><button type="button" data-l="ar" lang="ar">عربي</button>';
  box.insertBefore(sw,orig);
  const sync=()=>{const l=ar()?'ar':'en';sw.dataset.l=l;sw.querySelectorAll('button').forEach(b=>{const on=b.dataset.l===l;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))})};
  sw.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.l!==(ar()?'ar':'en'))orig.click()});
  sync();new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
}
/* ---------- 2. cart ---------- */
const bag='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.500-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.500-7 10-7 10z"/></svg>';
if(isIndex){
  const old=box.querySelector('#basket-toggle');if(old){old.classList.add('ha-cart-btn');old.innerHTML=bag+'<span class="ha-badge" id="basket-count">'+(read().length)+'</span>'}
}else{
  const old=box.querySelector('.basket-toggle');
  const wrap=document.createElement('div');wrap.className='ha-cart';
  wrap.innerHTML='<button type="button" class="ha-cart-btn" aria-haspopup="true" aria-expanded="false" aria-label="Donation basket">'+bag+'<span class="ha-badge" id="basket-count">0</span></button><div class="ha-pop" role="dialog" aria-label="Donation basket"></div>';
  if(old)old.replaceWith(wrap);else box.insertBefore(wrap,box.querySelector('.btn.small'));
  const btn=wrap.querySelector('.ha-cart-btn'),pop=wrap.querySelector('.ha-pop'),badge=wrap.querySelector('.ha-badge');
  const render=(bump)=>{
    const a=read();badge.textContent=a.length;badge.style.display=a.length?'':'none';
    if(bump){badge.classList.remove('bump');void badge.offsetWidth;badge.classList.add('bump')}
    const total=a.reduce((s,x)=>s+(Number(x.amount)||0),0);
    pop.innerHTML='<h4>'+t('Your giving basket','سلة عطائك')+'</h4>'+
      (a.length?'<div class="ha-list">'+a.map((x,i)=>'<div class="ha-row"><div><b>'+(ar()?x.ar||x.en:x.en)+'</b><small>'+money(x.amount)+'</small></div><button type="button" data-rm="'+i+'" aria-label="'+t('Remove','حذف')+'">×</button></div>').join('')+'</div><div class="ha-total"><span>'+t('Total','المجموع')+'</span><strong>'+money(total)+'</strong></div>'
      :'<p class="ha-empty">'+t('Your basket is empty. Add a donation from any project and it will appear here.','سلتك فارغة. أضف تبرعاً من أي مشروع وسيظهر هنا.')+'</p>')+
      '<a class="ha-go" href="cart.html">'+t('View cart','عرض السلة')+'</a>';
  };
  const setOpen=o=>{pop.classList.toggle('open',o);btn.setAttribute('aria-expanded',String(o))};
  btn.addEventListener('click',e=>{e.stopPropagation();setOpen(!pop.classList.contains('open'))});
  pop.addEventListener('click',e=>{e.stopPropagation();const r=e.target.closest('[data-rm]');if(r)IhsanCart.remove(+r.dataset.rm)});
  document.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
  let tm;IhsanCart.on(add=>{render(add);if(add){setOpen(true);clearTimeout(tm);tm=setTimeout(()=>setOpen(false),3200)}});
  addEventListener('storage',e=>{if(e.key===KEY)render(false)});
  new MutationObserver(()=>render(false)).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  render(false);
}
/* ---------- 3. donate ---------- */
const don=box.querySelector('.btn.small');
if(don){don.classList.add('ha-donate');don.href='Direct%20Donation.html';don.removeAttribute('target');don.removeAttribute('rel');
  const lbl=don.dataset.ar?don.textContent:don.textContent;
  don.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.500-4.700-7.500-10.500A4.300 4.300 0 0 1 12 8a4.300 4.300 0 0 1 7.500 2.500C19.500 16.300 12 21 12 21z"/></svg><span data-ar="تبرع الآن" data-en="Donate now">'+(ar()?'تبرع الآن':'Donate now')+'</span>';
  new MutationObserver(()=>{don.querySelector('span').textContent=ar()?'تبرع الآن':'Donate now'}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  don.removeAttribute('data-ar');
}
})();
/* ---------- mobile menu: "Donate now" button at the bottom (shown ≤1000px) ---------- */
(()=>{
const nav=document.querySelector('#navigation');if(!nav)return;
const a=document.createElement('a');a.className='mnav-donate';a.href='Direct%20Donation.html';
a.innerHTML='<span class="mnav-ic" aria-hidden="true"></span><span class="mnav-t"></span>';
nav.append(a);
const lbl=()=>{a.querySelector('.mnav-t').textContent=document.documentElement.lang==='ar'?'تبرع الآن':'Donate now'};
lbl();new MutationObserver(lbl).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
