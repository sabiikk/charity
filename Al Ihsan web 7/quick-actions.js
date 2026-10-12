// Home: floating quick actions on the left — language, Donate, Zakat calculator
(()=>{
const ar=()=>document.documentElement.lang==='ar';
const I=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const box=document.createElement('div');box.className='qa';
box.innerHTML=
 `<button type="button" class="qa-btn qa-lang">${I('<path d="M4 5h8M8 3v2M5.5 5c.8 3.2 3.2 5.6 6 6.5M10.5 5c-.7 2.9-2.9 5.6-6 7"/><path d="M13 20l3.5-8 3.5 8M14.2 17.3h4.6"/>')}<span class="qa-tip"></span></button>`+
 `<a class="qa-donate" href="Direct%20Donation.html">${I('<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>')}<b></b></a>`+
 `<a class="qa-btn qa-calc" href="zakat.html">${I('<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h3.5"/>')}<span class="qa-tip"></span></a>`;
document.body.append(box);
const lang=box.querySelector('.qa-lang'),calc=box.querySelector('.qa-calc'),don=box.querySelector('.qa-donate b');
const label=()=>{const a=ar();lang.querySelector('.qa-tip').textContent=a?'English':'العربية';lang.setAttribute('aria-label',a?'Switch to English':'التبديل إلى العربية');
 calc.querySelector('.qa-tip').textContent=a?'حاسبة الزكاة':'Zakat calculator';calc.setAttribute('aria-label',a?'حاسبة الزكاة':'Zakat calculator');don.textContent=a?'تبرع':'Donate'};
lang.addEventListener('click',()=>{const b=document.querySelector('#language');if(b)b.click()});
label();new MutationObserver(label).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
// tuck away while the footer is in view
addEventListener('scroll',()=>{const f=document.querySelector('.connect,footer');box.classList.toggle('away',!!f&&f.getBoundingClientRect().top<innerHeight*.6)},{passive:true});
})();
