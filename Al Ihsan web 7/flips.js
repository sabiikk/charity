function setFlipped(card,on,moveFocus=false){
 const front=card.querySelector('.flip-front'),back=card.querySelector('.flip-back');
 if(on){back.inert=false;back.setAttribute('aria-hidden','false');if(moveFocus)back.querySelector('.flip-close').focus({preventScroll:true});front.inert=true;front.setAttribute('aria-hidden','true')}
 else{front.inert=false;front.setAttribute('aria-hidden','false');if(moveFocus)front.querySelector('.flip-trigger').focus({preventScroll:true});back.inert=true;back.setAttribute('aria-hidden','true')}
 card.classList.toggle('flipped',on);card.querySelector('.flip-trigger').setAttribute('aria-expanded',String(on));
}
// Wheel/trackpad scrolling slides cards under a still cursor and fires pointerover; only flip on real mouse movement.
let lastScroll=0;
window.addEventListener('scroll',()=>{lastScroll=performance.now()},{passive:true});
document.addEventListener('pointerover',e=>{const card=e.target.closest('.flip-card');if(!card||e.pointerType!=='mouse'||card.contains(e.relatedTarget))return;if(performance.now()-lastScroll<200)return;if(!card.classList.contains('suppress-hover'))setFlipped(card,true)});
document.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||performance.now()-lastScroll<200)return;const card=e.target.closest('.flip-card');if(card&&!card.classList.contains('flipped')&&!card.classList.contains('suppress-hover'))setFlipped(card,true)},{passive:true});
document.addEventListener('pointerout',e=>{const card=e.target.closest('.flip-card');if(!card||e.pointerType!=='mouse'||card.contains(e.relatedTarget))return;if(card.dataset.autoFlip&&performance.now()-lastScroll<200)return;delete card.dataset.autoFlip;card.classList.remove('suppress-hover');if(!card.contains(document.activeElement))setFlipped(card,false)});
document.addEventListener('click',e=>{const trigger=e.target.closest('.flip-trigger');if(trigger){const card=trigger.closest('.flip-card');card.classList.remove('suppress-hover');setFlipped(card,true,true)}const close=e.target.closest('.flip-close');if(close){const card=close.closest('.flip-card');setFlipped(card,false,true);card.classList.add('suppress-hover')}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const card=e.target.closest('.flip-card');if(card?.classList.contains('flipped')){setFlipped(card,false,true);card.classList.add('suppress-hover')}}});
document.addEventListener('focusout',e=>{const card=e.target.closest('.flip-card');if(card&&!card.contains(e.relatedTarget)&&!card.matches(':hover'))setFlipped(card,false)});
// Scroll showcase: every card in a row flips to its donation side (left to right) when the row scrolls into view, and back when it leaves.
(()=>{
if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;
const column=card=>{const grid=card.parentElement,cols=getComputedStyle(grid).gridTemplateColumns.split(' ').length||1;return [...grid.children].indexOf(card)%cols};
const io=new IntersectionObserver(es=>es.forEach(e=>{
  const card=e.target;
  if(e.intersectionRatio>=.6){if(!card.classList.contains('flipped')&&!card.classList.contains('suppress-hover')){clearTimeout(card._showT);card._showT=setTimeout(()=>{setFlipped(card,true);card.dataset.autoFlip='1'},250+column(card)*180)}}
  else{clearTimeout(card._showT);if(!e.isIntersecting&&card.dataset.autoFlip){delete card.dataset.autoFlip;card.classList.remove('suppress-hover');if(!card.contains(document.activeElement))setFlipped(card,false)}}
}),{threshold:[0,.6]});
const watch=()=>document.querySelectorAll('.flip-card:not([data-flip-watch])').forEach(c=>{c.dataset.flipWatch='1';io.observe(c)});
watch();
new MutationObserver(watch).observe(document.body,{childList:true,subtree:true});
})();
