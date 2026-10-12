function setFlipped(card,on,moveFocus=false){
 const front=card.querySelector('.flip-front'),back=card.querySelector('.flip-back');
 if(on){back.inert=false;back.setAttribute('aria-hidden','false');if(moveFocus)back.querySelector('.flip-close').focus({preventScroll:true});front.inert=true;front.setAttribute('aria-hidden','true')}
 else{front.inert=false;front.setAttribute('aria-hidden','false');if(moveFocus)front.querySelector('.flip-trigger').focus({preventScroll:true});back.inert=true;back.setAttribute('aria-hidden','true')}
 card.classList.toggle('flipped',on);card.querySelector('.flip-trigger').setAttribute('aria-expanded',String(on));
}
document.addEventListener('pointerover',e=>{const card=e.target.closest('.flip-card');if(!card||e.pointerType!=='mouse'||card.contains(e.relatedTarget))return;if(!card.classList.contains('suppress-hover'))setFlipped(card,true)});
document.addEventListener('pointerout',e=>{const card=e.target.closest('.flip-card');if(!card||e.pointerType!=='mouse'||card.contains(e.relatedTarget))return;card.classList.remove('suppress-hover');if(!card.contains(document.activeElement))setFlipped(card,false)});
document.addEventListener('click',e=>{const trigger=e.target.closest('.flip-trigger');if(trigger){const card=trigger.closest('.flip-card');card.classList.remove('suppress-hover');setFlipped(card,true,true)}const close=e.target.closest('.flip-close');if(close){const card=close.closest('.flip-card');setFlipped(card,false,true);card.classList.add('suppress-hover')}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const card=e.target.closest('.flip-card');if(card?.classList.contains('flipped')){setFlipped(card,false,true);card.classList.add('suppress-hover')}}});
document.addEventListener('focusout',e=>{const card=e.target.closest('.flip-card');if(card&&!card.contains(e.relatedTarget)&&!card.matches(':hover'))setFlipped(card,false)});
