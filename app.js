/* horizontal wheel → make mouse-wheel act sideways */
document.querySelector('.h-scroll').addEventListener('wheel', e=>{
  e.preventDefault();
  e.currentTarget.scrollBy({left:e.deltaY,behavior:'smooth'});
});

/* open / close articles */
document.querySelectorAll('.card').forEach(card=>{
  card.addEventListener('click', ()=>{
    document.getElementById(card.dataset.article).classList.add('open');
    document.body.style.overflow='hidden';
  });
});
document.querySelectorAll('.close').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    btn.closest('.article').classList.remove('open');
    document.body.style.overflow='';
  });
});
