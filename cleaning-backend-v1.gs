// TrendOS Cleaning V1 backend.
const CLEAN_SHEET_V1='تشغيل - النظافة اليومية';
const CLEAN_TZ_V1='Africa/Cairo';
function cleanTxtV1_(v){return String(v==null?'':v).trim();}
function cleaningV1_(e){
  const p=(e&&e.parameter)||{},a=authorize_(p.username,p.token);if(!a.ok)return{success:false,message:a.message};
  const op=cleanTxtV1_(p.op||'');if(op!=='complete')return{success:false,message:'عملية غير معروفة.'};
  let data={};try{data=JSON.parse(cleanTxtV1_(p.payload)||'{}');}catch(err){return{success:false,message:'بيانات غير صحيحة.'};}
  const employee=cleanTxtV1_(a.user.name||a.user.username),department=cleanTxtV1_(a.user.department||data.department),date=cleanTxtV1_(data.date)||Utilities.formatDate(new Date(),CLEAN_TZ_V1,'yyyy-MM-dd');
  const sh=ss_().getSheetByName(CLEAN_SHEET_V1);if(!sh)return{success:false,message:'شيت النظافة غير موجود.'};
  const last=sh.getLastRow(),vals=last>1?sh.getRange(2,1,last-1,14).getValues():[];
  for(let i=0;i<vals.length;i++){if(cleanTxtV1_(vals[i][1])===date&&cleanTxtV1_(vals[i][2])===employee)return{success:true,alreadyDone:true};}
  const now=Utilities.formatDate(new Date(),CLEAN_TZ_V1,"yyyy-MM-dd'T'HH:mm:ssXXX");
  sh.appendRow(['CLN-'+Utilities.getUuid().slice(0,8).toUpperCase(),date,employee,department,cleanTxtV1_(data.startedAt)||'', 'تم','تم','تم','تم','تم','تم',cleanTxtV1_(data.issue)||'',now,'مكتمل']);
  return{success:true,message:'تم تسجيل النظافة والتجهيز.'};
}
