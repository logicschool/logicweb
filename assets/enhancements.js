(()=>{'use strict';
 document.querySelectorAll('a.nav-link,.nav-more-panel a').forEach(a=>{const p=new URL(a.href,location.href).pathname;const current=location.pathname==='/'?'/index.html':location.pathname;a.classList.toggle('active',p===current||(p==='/courses/index.html'&&current.startsWith('/courses/'))||(p==='/results.html'&&current.startsWith('/results/'))||(p==='/blog.html'&&current.startsWith('/blog/')));});
 document.querySelectorAll('.nav-resource-menu').forEach(menu=>menu.querySelector('button')?.classList.toggle('active',!!menu.querySelector('a.active')));
 if(document.querySelector('[data-branch-id]'))fetch('/api/public/content/branches').then(r=>r.json()).then(d=>d.items.forEach(b=>{const card=document.querySelector(`[data-branch-id="${CSS.escape(b.id)}"]`);if(!card)return;const title=card.querySelector('h3,h2');if(title&&b.name)title.textContent=b.name;card.querySelectorAll('a[href^="tel:"]').forEach(a=>{if(b.phone){a.href='tel:'+b.phone.replace(/[^+\d]/g,'');a.textContent=b.phone;}});})).catch(()=>{});
 // Results keep their category links; course posters and placements keep the existing lightbox.
 // Do not restructure the Page Editor iframe: its generated-content markers must stay intact.
 if(!new URLSearchParams(location.search).has('cms_edit')&&/^\/(?:results(?:\/[a-z0-9-]+)?|placements)\.html$/.test(location.pathname)){
  document.querySelectorAll('main .result-poster-grid').forEach(grid=>{
   const cards=[...grid.children].filter(el=>el.classList.contains('result-poster-card'));if(!cards.length)return;
   grid.classList.add('success-slider');grid.setAttribute('aria-label',location.pathname==='/placements.html'?'Placement highlights':'Results');
   const clone=node=>{const copy=node.cloneNode(true);copy.dataset.sliderClone='';copy.setAttribute('aria-hidden','true');copy.removeAttribute('id');copy.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));copy.querySelectorAll('a,button,input,select,textarea,[tabindex]').forEach(el=>el.tabIndex=-1);return copy;};
   const rows=[];for(let start=0;start<cards.length;start+=7)rows.push(cards.slice(start,start+7));
   const parts=rows.map((items,index)=>{const row=document.createElement('div');row.className='success-row';row.setAttribute('role','group');row.setAttribute('aria-label','Row '+(index+1));const track=document.createElement('div');track.className='success-track';if(index%2)track.classList.add('is-reversed');const group=document.createElement('div');group.className='success-group';items.forEach(card=>{card.setAttribute('data-logic-animation','none');group.append(card);});track.append(group);row.append(track);grid.append(row);return {row,track,group,items};});
   if(cards.length===1)grid.classList.add('is-single');
   let previousWidth=0;
   function measure(){const width=grid.clientWidth;if(!width||width===previousWidth)return;previousWidth=width;
    const gap=parseFloat(getComputedStyle(parts[0].group).gap)||16;
    // Fit seven on desktop; retain readable card sizes and seven-item batches on smaller screens.
    if(innerWidth>=1024)grid.style.setProperty('--success-card-width',((width-6*gap)/7)+'px');else grid.style.removeProperty('--success-card-width');
    for(const {row,track,group,items}of parts){track.querySelectorAll('[data-slider-clone]').forEach(el=>el.remove());if(cards.length===1)continue;
     const cardWidth=items[0].getBoundingClientRect().width;
     // One copy supports the loop. Never pad a short row with repeated individual posters.
     const distance=Math.max(items.length*(cardWidth+gap),row.clientWidth+gap);group.style.minWidth=distance+'px';track.style.setProperty('--success-distance',distance+'px');track.style.setProperty('--success-duration',Math.max(18,distance/28)+'s');track.append(clone(group));
    }
   }
   measure();if('ResizeObserver'in window)new ResizeObserver(measure).observe(grid);else window.addEventListener('resize',measure);
   if('IntersectionObserver'in window)new IntersectionObserver(entries=>entries.forEach(e=>grid.classList.toggle('is-offscreen',!e.isIntersecting)),{rootMargin:'80px'}).observe(grid);
  });
 }
})();
