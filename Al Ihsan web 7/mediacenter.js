document.documentElement.classList.add('js');
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.1,rootMargin:'0px 0px -40px 0px'});
$$('.fade').forEach(e=>io.observe(e));
/* language + mobile menu */
$$('[data-ar]').forEach(e=>e.dataset.en=e.innerHTML);
$('#language').addEventListener('click',e=>{const ar=document.documentElement.lang!=='ar';document.documentElement.lang=ar?'ar':'en';document.documentElement.dir=ar?'rtl':'ltr';$$('[data-ar]').forEach(x=>x.innerHTML=x.dataset[ar?'ar':'en']);e.target.textContent=ar?'English':'العربية';e.target.lang=ar?'en':'ar'});
const menu=$('.menu');if(menu)menu.addEventListener('click',()=>{const o=$('nav').classList.toggle('open');menu.setAttribute('aria-expanded',String(o))});
