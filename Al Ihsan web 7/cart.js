/* Donation cart: renders the shared basket (window.IhsanCart from header-actions.js) */
(()=>{
const root=document.getElementById('ct-root');if(!root||!window.IhsanCart)return;
const ar=()=>document.documentElement.lang==='ar',t=(en,a)=>ar()?a:en;
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=n=>(Number(n)||0).toLocaleString('en-US');
const PAY='https://alihsan.ae/ar/donation/direct-donation';
const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const heart='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>';
const trash='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';
const lock='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
const aed=()=>t('AED','درهم');
const render=()=>{
  const a=IhsanCart.items();
  if(!a.length){root.innerHTML='<div class="ct-empty">'+heart+'<h2>'+t('Your cart is empty','سلتك فارغة')+'</h2><p>'+t('Add a donation from any project and it will appear here.','أضف تبرعاً من أي مشروع وسيظهر هنا.')+'</p><a class="ct-btn ct-pay" href="projects.html">'+t('Browse projects','تصفّح المشاريع')+arrow+'</a></div>';return}
  const total=a.reduce((s,x)=>s+(Number(x.amount)||0),0);
  root.innerHTML='<div class="ct-layout"><div class="ct-list ct-table" role="table" aria-label="'+t('Donation cart','سلة التبرعات')+'">'+
    '<div class="ct-row ct-headrow" role="row"><span role="columnheader">'+t('No.','م')+'</span><span role="columnheader">'+t('Project or campaign','المشروع أو الحملة')+'</span><span role="columnheader">'+t('Amount','المبلغ')+'</span><span></span></div>'+
    a.map((x,i)=>{const name=esc(ar()?x.ar||x.en:x.en),link=x.id?'project.html?id='+encodeURIComponent(x.id):'';
      return '<div class="ct-row ct-item" role="row"><span class="ct-no" role="cell">'+String(i+1).padStart(2,'0')+'</span>'+
      '<div class="ct-proj" role="cell"><span class="ct-thumb">'+(x.img?'<img src="'+esc(x.img)+'" alt="">':heart)+'</span><span class="ct-name"><b>'+name+'</b>'+(link?'<a href="'+link+'">'+t('View project','عرض المشروع')+'</a>':'<small>'+t('Donation','تبرع')+'</small>')+'</span></div>'+
      '<label class="ct-amt" role="cell"><input type="number" min="1" inputmode="numeric" value="'+(Number(x.amount)||0)+'" data-i="'+i+'" aria-label="'+t('Amount for','المبلغ لـ')+' '+name+'"><span>'+aed()+'</span></label>'+
      '<button type="button" class="ct-rm" data-rm="'+i+'" aria-label="'+t('Remove','حذف')+' '+name+'" title="'+t('Remove','حذف')+'">'+trash+'</button></div>'}).join('')+
    '</div><aside class="ct-sum" aria-label="'+t('Donation summary','ملخص التبرع')+'"><h2>'+t('Donation summary','ملخص التبرع')+'</h2>'+
    '<div class="ct-line"><span>'+t('Projects','المشاريع')+'</span><b>'+a.length+'</b></div>'+
    '<div class="ct-line"><span>'+t('Subtotal','المجموع الفرعي')+'</span><b id="ct-sub">'+num(total)+' '+aed()+'</b></div>'+
    '<div class="ct-line ct-grand"><span>'+t('Total Amount','المبلغ الإجمالي')+'</span><strong id="ct-sum">'+num(total)+'<small>'+aed()+'</small></strong></div>'+
    '<a class="ct-btn ct-pay" href="'+PAY+'" target="_blank" rel="noopener">'+t('Proceed to donate','متابعة التبرع')+arrow+'</a>'+
    '<a class="ct-btn ct-more" href="projects.html">'+t('Add more projects','أضف مشاريع أخرى')+'</a>'+
    '<p class="ct-safe">'+lock+t('Secure payment · Al Ihsan Charity','دفع آمن · جمعية الإحسان الخيرية')+'</p></aside></div>';
};
/* typing updates the total live; the store is saved on change so the field keeps focus */
root.addEventListener('input',e=>{const f=e.target.closest('input[data-i]');if(!f)return;
  const a=IhsanCart.items();a[+f.dataset.i].amount=Math.max(0,Number(f.value)||0);
  const total=a.reduce((s,x)=>s+(Number(x.amount)||0),0);
  document.getElementById('ct-sum').innerHTML=num(total)+'<small>'+aed()+'</small>';document.getElementById('ct-sub').textContent=num(total)+' '+aed()});
root.addEventListener('change',e=>{const f=e.target.closest('input[data-i]');if(!f)return;const v=Math.max(1,Number(f.value)||1);IhsanCart.set(+f.dataset.i,v);render()});
root.addEventListener('click',e=>{const b=e.target.closest('[data-rm]');if(!b)return;IhsanCart.remove(+b.dataset.rm);render()});
new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
addEventListener('storage',render);
render();
})();
