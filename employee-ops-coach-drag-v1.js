(function(){
  'use strict';
  if(window.__TRENDOS_EMPLOYEE_OPS_COACH_DRAG_V1__) return;
  window.__TRENDOS_EMPLOYEE_OPS_COACH_DRAG_V1__=true;
  if(window.MATBAGY_EMPLOYEE_OPS_COACH_DRAG_V1===false) return;

  const STORAGE_KEY='trendOpsCoachPositionV1';
  const GAP=6;
  const txt=v=>String(v==null?'':v).trim();

  function currentUserKey(){
    const s=window.trendosState||window.state||{},u=s.user||{};
    return txt(u.username||u.name||'employee').toLowerCase();
  }
  function key(){return STORAGE_KEY+'|'+currentUserKey();}
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function viewportPosition(root,left,top){
    const w=root.offsetWidth||300,h=root.offsetHeight||52;
    return {
      left:clamp(Number(left)||GAP,GAP,Math.max(GAP,window.innerWidth-w-GAP)),
      top:clamp(Number(top)||GAP,GAP,Math.max(GAP,window.innerHeight-h-GAP))
    };
  }
  function apply(root,pos){
    if(!root||!pos)return;
    const p=viewportPosition(root,pos.left,pos.top);
    root.style.right='auto';
    root.style.bottom='auto';
    root.style.left=p.left+'px';
    root.style.top=p.top+'px';
  }
  function restore(root){
    try{
      const p=JSON.parse(localStorage.getItem(key())||'null');
      if(p&&Number.isFinite(Number(p.left))&&Number.isFinite(Number(p.top))) apply(root,p);
    }catch(e){}
  }
  function save(root){
    try{
      const r=root.getBoundingClientRect();
      localStorage.setItem(key(),JSON.stringify({left:Math.round(r.left),top:Math.round(r.top)}));
    }catch(e){}
  }
  function makeDraggable(root){
    if(!root||root.dataset.opsDragReady==='1')return;
    root.dataset.opsDragReady='1';
    const handle=root.querySelector('.oc-pill');
    if(!handle)return;
    handle.style.touchAction='none';
    handle.style.userSelect='none';
    handle.title='اسحب الشريط للمكان المناسب — لا يمكن إغلاقه';
    restore(root);

    let active=false,moved=false,suppressClick=false,startX=0,startY=0,startLeft=0,startTop=0,pointerId=null;
    handle.addEventListener('pointerdown',function(e){
      if(e.pointerType==='mouse'&&e.button!==0)return;
      const r=root.getBoundingClientRect();
      active=true;moved=false;pointerId=e.pointerId;
      startX=e.clientX;startY=e.clientY;startLeft=r.left;startTop=r.top;
      root.style.right='auto';root.style.bottom='auto';root.style.left=r.left+'px';root.style.top=r.top+'px';
      try{handle.setPointerCapture(pointerId);}catch(err){}
    });
    handle.addEventListener('pointermove',function(e){
      if(!active||e.pointerId!==pointerId)return;
      const dx=e.clientX-startX,dy=e.clientY-startY;
      if(!moved&&Math.hypot(dx,dy)<5)return;
      moved=true;
      const p=viewportPosition(root,startLeft+dx,startTop+dy);
      root.style.left=p.left+'px';root.style.top=p.top+'px';
      e.preventDefault();
    });
    function finish(e){
      if(!active||e.pointerId!==pointerId)return;
      active=false;
      try{handle.releasePointerCapture(pointerId);}catch(err){}
      if(moved){
        suppressClick=true;
        save(root);
        setTimeout(function(){suppressClick=false;},120);
      }
      pointerId=null;
    }
    handle.addEventListener('pointerup',finish);
    handle.addEventListener('pointercancel',finish);
    handle.addEventListener('click',function(e){
      if(!suppressClick)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    },true);

    window.addEventListener('resize',function(){
      const r=root.getBoundingClientRect();
      apply(root,{left:r.left,top:r.top});
      save(root);
    });
  }

  const timer=setInterval(function(){
    const root=document.getElementById('trendOpsCoach');
    if(!root)return;
    makeDraggable(root);
    clearInterval(timer);
  },300);
})();
