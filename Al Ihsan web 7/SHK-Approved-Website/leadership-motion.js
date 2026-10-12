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
