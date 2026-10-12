const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
$$('.fq-q').forEach(b=>b.addEventListener('click',()=>{const it=b.parentElement,o=!it.classList.contains('open');$$('.fq-item').forEach(x=>{x.classList.remove('open');$('.fq-q',x).setAttribute('aria-expanded','false')});if(o){it.classList.add('open');b.setAttribute('aria-expanded','true')}}));
let cat='all';const items=$$('.fq-item'),cnt=$('#fq-count'),emp=$('#fq-empty'),sq=$('#fq-search');
const filt=()=>{const q=sq.value.trim().toLowerCase();let n=0;items.forEach(it=>{const ok=(cat==='all'||it.dataset.cat===cat)&&(!q||it.textContent.toLowerCase().includes(q));it.hidden=!ok;if(ok)n++});emp.hidden=n>0;cnt.textContent=(document.documentElement.lang==='ar'?n+' سؤال':n+(n===1?' question':' questions'))};
sq.addEventListener('input',filt);filt();
const ar=()=>document.documentElement.lang==='ar',t=$('#fq-text'),m=$('#fq-msg');
$('#fq-form').addEventListener('submit',e=>{e.preventDefault();const v=t.value.trim();t.classList.toggle('bad',!v);m.hidden=false;
 if(!v){m.className='fq-msg';m.textContent=ar()?'يرجى كتابة سؤالك.':'Please write your question.';return}
 m.className='fq-msg ok';m.textContent=ar()?'شكراً لك! تم استلام سؤالك وسنرد عليك قريباً.':'Thank you! We received your question and will reply soon.';t.value=''});
$$('[data-ar]').forEach(e=>e.dataset.en=e.innerHTML);$$('[data-ar-ph]').forEach(e=>e.dataset.enPh=e.placeholder);
$('#language').addEventListener('click',e=>{const a=document.documentElement.lang!=='ar';document.documentElement.lang=a?'ar':'en';document.documentElement.dir=a?'rtl':'ltr';$$('[data-ar]').forEach(x=>x.innerHTML=x.dataset[a?'ar':'en']);$$('[data-ar-ph]').forEach(x=>x.placeholder=a?x.dataset.arPh:x.dataset.enPh);e.target.textContent=a?'English':'العربية';e.target.lang=a?'en':'ar';m.hidden=true;filt()});
const menu=$('.menu');menu.addEventListener('click',()=>{const o=$('nav').classList.toggle('open');menu.setAttribute('aria-expanded',String(o))});
