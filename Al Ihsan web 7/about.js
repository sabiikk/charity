const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
$$('[data-ar]').forEach(e=>e.dataset.en=e.innerHTML);
$('#language').addEventListener('click',e=>{const a=document.documentElement.lang!=='ar';document.documentElement.lang=a?'ar':'en';document.documentElement.dir=a?'rtl':'ltr';$$('[data-ar]').forEach(x=>x.innerHTML=x.dataset[a?'ar':'en']);e.target.textContent=a?'English':'العربية';e.target.lang=a?'en':'ar'});
const menu=$('.menu');menu.addEventListener('click',()=>{const o=$('nav').classList.toggle('open');menu.setAttribute('aria-expanded',String(o))});
/* story tabs */
(()=>{const tabs=$('#ab-tabs'),chs=$$('.ab-ch');if(!tabs||!chs.length)return;
chs.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.className='ab-tab';const h=$('h3',c);b.innerHTML='<i>0'+(i+1)+'</i><span data-ar="'+h.dataset.ar+'">'+h.innerHTML+'</span>';b.addEventListener('click',()=>go(i));tabs.appendChild(b)});
const go=i=>{chs.forEach((c,k)=>c.classList.toggle('on',k===i));$$('.ab-tab',tabs).forEach((t,k)=>{t.classList.toggle('on',k===i);t.setAttribute('aria-selected',String(k===i))})};go(0);
let t=0;const auto=setInterval(()=>{if(document.hidden)return;t=(t+1)%chs.length;go(t)},8000);tabs.addEventListener('click',()=>clearInterval(auto));
/* tabs labels follow language */
new MutationObserver(()=>$$('.ab-tab span',tabs).forEach((s,k)=>{s.innerHTML=s.dataset[document.documentElement.lang==='ar'?'ar':'en']||s.innerHTML})).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
$$('.ab-tab span',tabs).forEach(s=>s.dataset.en=s.innerHTML)})();
