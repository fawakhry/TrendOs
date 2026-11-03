/* Matbagy customer messaging presentation. Default OFF, no transport or identity.
 * Reuses original draft fields/buttons, image viewer, recipe and order writer.
 */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document)root.TrendOSCustomerMessenger=api;
})(typeof window==='undefined'?null:window,function(root){
 'use strict';
 let mounted=false,doc=null,view=null,rows=[],selected=null,busy=false,lastCount=0,busyControls=[];
 const ids={messages:'customerDraftMessages',notes:'customerOrderNotes',item:'customerOrderItem'};
 const $=id=>doc.getElementById(id);
 const text=x=>String(x==null?'':x);
 function appendNotes(prior,message){const s=text(message).trim();if(!s)return text(prior);const next=[text(prior).trim(),s].filter(Boolean).join('\n');if(next.length>1200)throw Error('اختصر تفاصيل البند قبل إضافة رسالة أخرى.');return next;}
 function recipeSummary(value){const source=text(value),start=source.indexOf('[مواصفات مطبعجي]'),end=source.indexOf('[نهاية المواصفات]',start);if(start<0||end<start)return '';return source.slice(start,end).split('\n').filter(line=>/^(المقاس النهائي|مقاس التيشيرت):/.test(line)).slice(0,2).join('\n');}
 function safeLocalPreview(file){return file&&file.localPreview===true&&/^blob:/.test(text(file.previewUrl))&&/^image\/(png|jpeg|webp|gif)$/.test(text(file.mimeType||file.type))?file.previewUrl:'';}
 function publicOrder(row){return {orderId:text(row.orderId),itemName:text(row.itemName),department:text(row.department),status:text(row.displayStatus||row.status),notes:text(row.notes),delivery:text(row.deliveryText||row.delivery)};}
 function enabled(){return !!(root&&root.TRENDOS_CUSTOMER_CHAT_V1_ENABLED===true);}
 function node(tag,cls,value){const n=doc.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=text(value);return n;}
 function button(label,id,cls){const b=node('button',cls||'cm-icon',label);b.type='button';b.id=id;b.setAttribute('aria-label',label);return b;}
 function open(id){const d=$(id);if(d&&!d.open)d.showModal();}
 function close(id){const d=$(id);if(d&&d.open)d.close();}
 function instructions(value){return root.TrendOSCustomerRecipe?root.TrendOSCustomerRecipe.stripPrior(value):text(value);}
 function bubble(parent,value,user){const b=node('div','cm-bubble'+(user?' cm-out':''),value);parent.append(b);return b;}
 function localLabel(parent,value){parent.append(node('small','cm-message-label',value));}
 function attachList(parent,files,group,index){
  (files||[]).forEach((file,i)=>{
   const name=text(file.name||file.fileName||'مرفق'),url=safeLocalPreview(file);
   if(url){const b=button('معاينة '+name,'','cm-image wa-image-open');b.setAttribute('data-image-group',group);b.setAttribute('data-item-index',text(index));b.setAttribute('data-image-index',text(i));const image=node('img');image.src=url;image.alt=name;image.addEventListener('load',()=>{const stream=$(ids.messages);if(stream)stream.scrollTop=stream.scrollHeight;},{once:true});b.append(image);parent.append(b);}
   parent.append(node('span','cm-file-name',name+(url?'':' · المعاينة الخاصة غير متاحة')));
  });
 }
 function selectDraft(){
  selected=null;$('customerMessengerHistory').hidden=true;$(ids.messages).hidden=false;
  $('customerMessengerComposer').hidden=false;$('customerMessengerActions').hidden=false;
  $('customerMessengerReadOnly').hidden=true;$('customerMessengerTitle').textContent='مطبعجي بنها';
  $('customerMessengerSubtitle').textContent='طلبك يبدأ بمحادثة';$('customerMessengerDraft').classList.add('selected');
  $('customerMessengerDate').textContent='المسودة الحالية';
  view.dataset.messengerPane='thread';
  $('customerOrdersList').querySelectorAll('button').forEach(b=>b.classList.remove('selected'));
 }
 function openDetails(){selectDraft();open('customerMessengerDetails');}
 function selectOrder(row,buttonNode){
  selected=row;$('customerMessengerDraft').classList.remove('selected');
  $('customerMessengerHistory').hidden=false;$(ids.messages).hidden=true;
  $('customerMessengerComposer').hidden=true;$('customerMessengerActions').hidden=true;
  $('customerMessengerReadOnly').hidden=false;$('customerMessengerTitle').textContent=row.itemName||'متابعة طلب';
  $('customerMessengerSubtitle').textContent='أوردر '+row.orderId;$('customerMessengerDate').textContent='متابعة الطلب';view.dataset.messengerPane='thread';
  const history=$('customerMessengerHistory');history.replaceChildren();
  bubble(history,row.itemName+'\nالقسم: '+row.department,true);
  if(row.notes)bubble(history,instructions(row.notes),true);
  const status=bubble(history,'الحالة الحالية: '+row.status,false);localLabel(status,'آخر حالة أعادها نظام الطلبات');
  if(row.delivery)bubble(history,'التسليم المتوقع: '+row.delivery,false);
  $('customerOrdersList').querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b===buttonNode));
 }
 function mount(document){
  // Both the initial mount and every app hook fail closed when disabled.
  if(!enabled())return false;if(mounted)return true;
  if(!document||!document.getElementById('customerNewOrderPanel'))return false;
  doc=document;view=$('customerView');
  const required=['customerHomePanel','customerOrdersPanel','customerOrdersList','customerDraftMessages','customerOrderNotes','customerOrderItem','customerAddDraftItemBtn','customerSubmitDraftBtn','customerResetDraftBtn','customerShowNewOrderBtn'];
  if(required.some(id=>!$(id)))return false;
  const orderPanel=$('customerNewOrderPanel'),orderList=$('customerOrdersPanel');
  const shell=node('div','cm-shell');shell.id='customerMessengerShell';
  const side=node('aside','cm-sidebar');side.setAttribute('aria-label','قائمة محادثات الطلبات');
  const sideHead=node('div','cm-side-head');sideHead.append(node('span','cm-avatar','م'),node('b','','محادثاتك'));
  const newDraft=$('customerResetDraftBtn');newDraft.textContent='＋';newDraft.title='مسودة جديدة';newDraft.setAttribute('aria-label','مسودة جديدة');newDraft.className='cm-icon';
  const menu=button('⋮','customerMessengerMenu');menu.setAttribute('aria-label','إعدادات حساب العميل');sideHead.append(newDraft,menu);side.append(sideHead);
  const search=node('input','cm-search');search.type='search';search.placeholder='ابحث في طلباتك';search.id='customerMessengerOrderSearch';search.setAttribute('aria-label','البحث في طلباتي');side.append(search);
  const pin=button('طلبك الجديد','customerMessengerDraft','cm-conversation selected');pin.append(node('small','','اكتب فكرتك وكمّل التفاصيل في الشات'));side.append(pin);
  const listHead=node('div','cm-list-heading','طلباتي السابقة'),refresh=$('customerRefreshOrdersBtn');refresh.textContent='تحديث';listHead.append(refresh);side.append(listHead,$('customerOrdersStatus'),$('customerOrdersList'));
  const workspace=node('section','cm-workspace');workspace.setAttribute('aria-label','محادثة العميل');
  const head=node('div','cm-head'),back=button('‹','customerMessengerBack');back.setAttribute('aria-label','رجوع لقائمة الطلبات');head.append(back,node('span','cm-avatar cm-shop','م'));
  const headCopy=node('div','cm-head-copy'),title=node('b','','مطبعجي بنها');title.id='customerMessengerTitle';const subtitle=node('small','','طلبك يبدأ بمحادثة');subtitle.id='customerMessengerSubtitle';headCopy.append(title,subtitle);head.append(headCopy);
  const summaryBtn=button('☷','customerMessengerSummary');summaryBtn.setAttribute('aria-label','مراجعة ملخص الطلب');head.append(summaryBtn);workspace.append(head);
  const date=node('div','cm-date','المسودة الحالية');date.id='customerMessengerDate';workspace.append(date,$(ids.messages));
  const history=node('div','cm-history');history.id='customerMessengerHistory';history.hidden=true;history.setAttribute('aria-live','polite');workspace.append(history);
  const actions=node('div','cm-actions');actions.id='customerMessengerActions';const detailsBtn=button('＋ تفاصيل الطلب','customerMessengerProduct','cm-chip');const attachments=button('📎 صور وملفات','customerMessengerAttach','cm-chip');actions.append(detailsBtn,attachments);workspace.append(actions);
  const form=node('form','cm-type-row');form.id='customerMessengerComposer';
  const input=node('textarea');input.id='customerMessengerText';input.rows=1;input.maxLength=1000;input.placeholder='اكتب طلبك هنا…';input.setAttribute('aria-label','اكتب رسالتك');
  const send=button('➤','customerMessengerSend','cm-send');send.type='submit';send.setAttribute('aria-label','حفظ تفاصيل الرسالة في المسودة');form.append(input,send);workspace.append(form);
  const readonly=node('div','cm-readonly','متابعة الطلب حسب آخر حالة مسجلة.');readonly.id='customerMessengerReadOnly';readonly.hidden=true;const returnBtn=button('رجوع للمسودة','customerMessengerReturn','cm-chip');readonly.append(returnBtn);workspace.append(readonly);
  shell.append(side,workspace);view.append(shell);
  // Native fields are moved, never cloned: original listeners and file ownership survive.
  const details=node('dialog','cm-dialog');details.id='customerMessengerDetails';details.setAttribute('aria-labelledby','customerMessengerDetailsTitle');
  const detailHead=node('div','cm-dialog-head'),detailTitle=node('h3','','تفاصيل طلبك');detailTitle.id='customerMessengerDetailsTitle';const detailClose=button('×','customerMessengerDetailsClose');detailClose.setAttribute('aria-label','إغلاق تفاصيل الطلب');detailHead.append(detailTitle,detailClose);
  const nativeComposer=orderPanel.querySelector('.customer-chat-composer');const submitRow=nativeComposer.querySelector('.wa-submit-row');details.append(detailHead,$('customerOrderMsg'),nativeComposer);view.append(details);
  const summary=node('dialog','cm-dialog');summary.id='customerMessengerReview';summary.setAttribute('aria-labelledby','customerMessengerReviewTitle');
  const summaryHead=node('div','cm-dialog-head'),summaryTitle=node('h3','','ملخص المسودة');summaryTitle.id='customerMessengerReviewTitle';const summaryClose=button('×','customerMessengerReviewClose');summaryClose.setAttribute('aria-label','إغلاق ملخص المسودة');summaryHead.append(summaryTitle,summaryClose);const summaryItems=node('div');summaryItems.id='customerMessengerSummaryItems';summary.append(summaryHead,summaryItems,submitRow);view.append(summary);
  const settings=node('dialog','cm-dialog cm-settings');settings.id='customerMessengerSettings';settings.setAttribute('aria-label','إعدادات حساب العميل');const settingsClose=button('×','customerMessengerSettingsClose');settingsClose.setAttribute('aria-label','إغلاق الإعدادات');settings.append(settingsClose,node('h3','','حسابك في مطبعجي'),$('customerWelcomeTitle'),$('customerMeta'),$('customerChangePassBtn'),$('customerLogoutBtn'));view.append(settings);
  const notice=node('div','cm-local-note','النص المكتوب يظل ضمن تفاصيل البند حتى تضغط إضافة للمسودة.');workspace.append(notice);
  view.classList.add('customer-messenger-active');view.querySelector('.customer-topbar').hidden=true;
  // Hide the superseded visual wrappers and their duplicated entry points. Legacy OFF mode is intact.
  $('customerHomePanel').hidden=true;orderPanel.hidden=true;orderList.hidden=true;
  $(ids.messages).setAttribute('role','log');$(ids.messages).setAttribute('aria-label','رسائل مسودة الطلب');
  detailsBtn.addEventListener('click',openDetails);attachments.addEventListener('click',()=>{openDetails();$('customerOrderFiles').focus();});
  pin.addEventListener('click',selectDraft);returnBtn.addEventListener('click',selectDraft);back.addEventListener('click',()=>{view.dataset.messengerPane='list';});
  newDraft.addEventListener('click',selectDraft);menu.addEventListener('click',()=>open('customerMessengerSettings'));
  detailClose.addEventListener('click',()=>close('customerMessengerDetails'));summaryClose.addEventListener('click',()=>close('customerMessengerReview'));settingsClose.addEventListener('click',()=>close('customerMessengerSettings'));
  summaryBtn.addEventListener('click',()=>{if(selected){selectOrder(selected);return;}open('customerMessengerReview');});
  $('customerChangePassBtn').addEventListener('click',()=>close('customerMessengerSettings'));
  search.addEventListener('input',()=>renderOrders(rows));
  form.addEventListener('submit',event=>{event.preventDefault();if(busy||selected)return;try{const value=input.value.trim();if(!value)return;$(ids.notes).value=appendNotes($(ids.notes).value,value);input.value='';$(ids.notes).dispatchEvent(new Event('input',{bubbles:true}));}catch(e){$('customerOrderMsg').textContent=e.message;openDetails();}});
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();form.requestSubmit();}});
  [details,summary,settings].forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
  mounted=true;view.dataset.messengerPane='thread';return true;
 }
 function renderOrders(values){
  if(!enabled()||!mounted)return false;rows=(values||[]).filter(row=>row&&typeof row==='object').map(publicOrder);
  const list=$('customerOrdersList'),q=$('customerMessengerOrderSearch').value.trim().toLowerCase();list.replaceChildren();
  const visible=rows.filter(r=>(r.orderId+' '+r.itemName).toLowerCase().includes(q));
  if(!visible.length)list.append(node('p','cm-empty',q?'لا توجد طلبات مطابقة.':'لا توجد طلبات مرتبطة بحسابك حتى الآن.'));
  visible.forEach(row=>{const card=button(row.itemName||'طلب','', 'cm-conversation');card.setAttribute('aria-label','فتح أوردر '+row.orderId);card.append(node('span','cm-order-code','أوردر '+row.orderId),node('small','',row.status));card.addEventListener('click',()=>selectOrder(row,card));list.append(card);});
  if(selected){const current=rows.find(r=>r.orderId===selected.orderId);if(current)selectOrder(current);else selectDraft();}
  return true;
 }
 function renderDraft(snapshot){
  if(!enabled()||!mounted)return false;const data=snapshot||{},draft=data.draft||{items:[]};
  const stream=$(ids.messages),summary=$('customerMessengerSummaryItems');stream.replaceChildren();summary.replaceChildren();
  bubble(stream,'أهلاً بيك في مطبعجي! اكتب فكرتك، وضيف المنتج والمقاس والصور من تفاصيل الطلب.',false);
  const items=draft.items||[];
  items.forEach((item,index)=>{const spec=recipeSummary(item.notes),b=bubble(stream,text(item.itemName)+'\nالكمية: '+text(item.qty)+' · القسم: '+text(item.department)+(spec?'\n'+spec:''),true);const notes=instructions(item.notes);if(notes)b.append(node('div','cm-item-notes',notes));attachList(b,item.files,'draftItem',index);localLabel(b,'بند محفوظ في المسودة');const row=node('article','cm-summary-line');row.append(node('b','',text(item.itemName)),node('p','',text(item.qty)+' قطعة'),node('p','',spec),node('p','',notes));(item.files||[]).forEach(f=>row.append(node('small','',text(f.name||f.fileName||'مرفق'))));summary.append(row);});
  if(!items.length)summary.append(node('p','cm-empty','أضف بندًا للمسودة عشان يظهر ملخصه هنا.'));
  const pendingNotes=instructions($(ids.notes).value),pendingFiles=data.pendingFiles||[],pendingName=$(ids.item).value.trim();
  if(pendingNotes||pendingFiles.length||pendingName){const pending=bubble(stream,pendingNotes||pendingName||'المرفقات المختارة',true);attachList(pending,pendingFiles,'pending','');localLabel(pending,'تفاصيل لم تُحفظ كبند بعد');const choose=button('اختيار المنتج والمقاس','','cm-inline-action');choose.addEventListener('click',openDetails);pending.append(choose);}
  if(draft.submitted)bubble(stream,'تم إنشاء الأوردر: '+text(draft.orderId)+'\nتقدر تتابع حالته من قائمة طلباتك.',false);
  $('customerMessengerDraft').firstChild.textContent='طلبك الجديد'+(items.length?' · '+items.length+' بنود':'');
  if(items.length>lastCount){close('customerMessengerDetails');selectDraft();}
  lastCount=items.length;stream.scrollTop=stream.scrollHeight;return true;
 }
 function setBusy(value){if(!enabled()||!mounted)return;busy=!!value;$('customerMessengerText').disabled=busy;$('customerMessengerSend').disabled=busy;if(busy){if(!busyControls.length)busyControls=Array.from($('customerMessengerDetails').querySelectorAll('input,textarea,select')).concat([$('customerLogoutBtn'),$('customerResetDraftBtn')]).map(control=>({control,disabled:control.disabled}));busyControls.forEach(x=>x.control.disabled=true);}else{busyControls.forEach(x=>x.control.disabled=x.disabled);busyControls=[];}}
 function clearSession(){if(!mounted)return;setBusy(false);rows=[];selected=null;lastCount=0;['customerDraftMessages','customerMessengerHistory','customerOrdersList','customerMessengerSummaryItems'].forEach(id=>$(id).replaceChildren());$('customerMessengerText').value='';$('customerMessengerOrderSearch').value='';['customerMessengerDetails','customerMessengerReview','customerMessengerSettings'].forEach(close);}
 function resetDraft(){if(!enabled()||!mounted)return;lastCount=0;close('customerMessengerDetails');selectDraft();$('customerMessengerText').value='';}
 return {mount,renderOrders,renderDraft,setBusy,clearSession,resetDraft,appendNotes,recipeSummary,safeLocalPreview,publicOrder,enabled,sourceOnly:true,productionEnabled:false};
});
