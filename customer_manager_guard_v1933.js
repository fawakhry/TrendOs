/* TrendOS Customer Manager Guard V1933
 * Prevent AI hallucination when a WhatsApp conversation is not linked to an order.
 */
(function(){
  'use strict';

  function $(id){ return document.getElementById(id); }
  function text(v){ return String(v == null ? '' : v); }

  function hasLinkedOrder(){
    var ctx = $('tmCmContext');
    if(!ctx) return false;
    return /أوردر\s*#/i.test(text(ctx.textContent));
  }

  function setSafeFallback(){
    var composer = $('tmCmComposer');
    var status = $('tmCmStatus');
    if(composer){
      composer.value = 'أهلاً بحضرتك، ابعتلي رقم الأوردر عشان أقدر أراجع حالته.';
      composer.focus();
    }
    if(status){
      status.textContent = 'المحادثة غير مرتبطة بأوردر، لذلك تم تجهيز رد آمن يطلب رقم الأوردر بدل تشغيل AI بدون بيانات.';
      status.className = 'tm-cm-status ok';
    }
  }

  document.addEventListener('click', function(ev){
    var btn = ev.target && ev.target.closest ? ev.target.closest('#tmCmAi') : null;
    if(!btn) return;
    if(hasLinkedOrder()) return;

    ev.preventDefault();
    ev.stopPropagation();
    if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    setSafeFallback();
  }, true);

  window.TrendOSCustomerManagerGuardV1933 = {
    version: 'V1933_GUARD_20260827',
    hasLinkedOrder: hasLinkedOrder
  };
})();