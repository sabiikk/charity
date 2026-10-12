(function(){
  var tabs=document.querySelectorAll('.sp-tab'),cards=document.querySelectorAll('.sp-card'),cur=null;
  function show(f){
    cur=f;
    tabs.forEach(function(t){var on=t.dataset.f===f;t.classList.toggle('selected',on);t.setAttribute('aria-selected',on)});
    cards.forEach(function(c){c.hidden=!!f&&c.dataset.cat!==f});
  }
  tabs.forEach(function(t){t.addEventListener('click',function(){show(cur===t.dataset.f?null:t.dataset.f)})});
  show(null);
})();
