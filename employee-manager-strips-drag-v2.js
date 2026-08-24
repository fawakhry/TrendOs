(function(){
  'use strict';
  if(window.__TRENDOS_EMPLOYEE_MANAGER_STRIPS_DRAG_V2__) return;
  window.__TRENDOS_EMPLOYEE_MANAGER_STRIPS_DRAG_V2__=true;
  if(window.MATBAGY_EMPLOYEE_MANAGER_STRIPS_DRAG_V2===false) return;

  const BASE_KEY='trendEmployeeManagerStripsPosV2';
  const GAP=6;
  const txt=v=>String(v==null?'':v).trim();
  function userKey(){const s=window.trendosState||window.state||{},u=s.user||{};return txt(u.username||u.name||'employee').toLowerCase();}
  function storageKey(){return BASE_KEY+'|'+userKey();}
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function fit(root,left,top){
    const w=root.offsetWidth||330,h=root.offsetHeight||110;
    return {left:clamp(Number(left)||GAP,GAP,Math.max(GAP,window.innerWidth-w-GAP)),top:clamp(Number(top)||GAP,GAP,Math.max(GAP,window.innerHeight-h-GAP))};
  }
  function apply(root,pos){if(!root||!pos)return;const p=fit(root,pos.left,pos.top);root.style.right='auto';root.style.bottom='auto';root.style.left=p.left+'px';root.style.top=p.top+'px';}
  function restore(root){try{const p=JSON.parse(localStorage.getItem(storageKey())||'null');if(p)apply(root,p);}catch(e){}}
  function save(root){try{const r=root.getBoundingClientRect();localStorage.setItem(storageKey(),JSON.stringify({left:Math.round(r.left),top:Math.round(r.top)}));}catch(e){}}
  function attach(root){
    if(!root||root.dataset.dragV2==='1')return;root.dataset.dragV2='1';restore(root);
    root.querySelectorAll('[data-strip]').forEach(function(handle){
      handle.style.touchAction='none';handle.style.userSelect='none';handle.title='اسحب لنقل المتابعة — لا يمكن إغلاقها';
      let active=false,moved=false,suppress=false,pid=null,sx=0,sy=0,sl=0,st=0;
      handle.addEventListener('pointerdown',function(e){
        if(e.pointerType==='mouse'&&e.button!==0)return;
        const r=root.getBoundingClientRect();active=true;moved=false;pid=e.pointerId;sx=e.clientX;sy=e.clientY;sl=r.left;st=r.top;
        root.style.right='auto';root.style.bottom='auto';root.style.left=r.left+'px';root.style.top=r.top+'px';
        try{handle.setPointerCapture(pid);}catch(err){}
      });
      handle.addEventListener('pointermove',function(e){
        if(!active||e.pointerId!==pid)return;const dx=e.clientX-sx,dy=e.clientY-sy;
        if(!moved&&Math.hypot(dx,dy)<5)return;moved=true;const p=fit(root,sl+dx,st+dy);root.style.left=p.left+'px';root.style.top=p.top+'px';e.preventDefault();
      });
      function end(e){if(!active||e.pointerId!==pid)return;active=false;try{handle.releasePointerCapture(pid);}catch(err){}if(moved){suppress=true;save(root);setTimeout(function(){suppress=false;},140);}pid=null;}
      handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
      handle.addEventListener('click',function(e){if(!suppress)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();},true);
    });
    window.addEventListener('resize',function(){const r=root.getBoundingClientRect();apply(root,{left:r.left,top:r.top});save(root);});
  }
  const t=setInterval(function(){const root=document.getElementById('employeeManagerStripsV2');if(!root)return;attach(root);clearInterval(t);},250);
})();
