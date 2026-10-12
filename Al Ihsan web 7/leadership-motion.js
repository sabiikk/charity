(() => {
  const section=document.querySelector('.leadership');
  if(!section)return;
  if(!('IntersectionObserver' in window)){section.classList.add('is-visible');return;}
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(entry.isIntersecting){section.classList.add('is-visible');observer.unobserve(section);}
    }
  },{threshold:.12});
  observer.observe(section);
})();
/* leadership cards: tap to flip on touch screens (hover handles desktop) */
(()=>{document.querySelectorAll('.lflip').forEach(c=>c.addEventListener('click',e=>{if(e.target.closest('a'))return;if(matchMedia('(hover:hover)').matches)return;c.classList.toggle('is-flipped')}))})();
/* community photo: zoom origin follows the cursor */
(()=>{const p=document.querySelector('.cm-img');if(!p)return;p.addEventListener('mousemove',e=>{const r=p.getBoundingClientRect();p.style.setProperty('--mx',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');p.style.setProperty('--my',((e.clientY-r.top)/r.height*100).toFixed(1)+'%')});p.addEventListener('mouseleave',()=>{p.style.removeProperty('--mx');p.style.removeProperty('--my')})})();
