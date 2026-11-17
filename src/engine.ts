export type Reading={date:string; morning:string; evening:string; next:string};
export const defaults={bill:2500,units:0,rate:4.5,share:50,kw:3,yield:3.8,overlap:80,battery:5,efficiency:90,gridCost:110000,batteryCost:75000,grant:0,grantConfirmed:false,down:20000,apr:5,years:7,maintenance:1500,replacement:50000,replacementYear:10,horizon:20,uncertainty:20,mode:'quick',existing:false};
export type Settings=typeof defaults;
export function meter(rows:Reading[]){
 const valid=rows.filter(r=>r.date&&r.morning!==''&&r.evening!==''&&r.next!==''&&[r.morning,r.evening,r.next].every(v=>Number.isFinite(+v)&&+v>=0)&&+r.evening>=+r.morning&&+r.next>=+r.evening);
 const day=valid.reduce((s,r)=>s+(+r.evening-+r.morning),0), night=valid.reduce((s,r)=>s+(+r.next-+r.evening),0);
 return {count:valid.length,day:valid.length?day/valid.length*30:0,night:valid.length?night/valid.length*30:0};
}
export function payment(principal:number,apr:number,years:number){const n=years*12,r=apr/1200;return principal<=0?0:r===0?principal/n:principal*r/(1-Math.pow(1+r,-n));}
export function calculate(s:Settings,rows:Reading[],withBattery=false,factor=1){
 const m=meter(rows), measured=s.mode==='meter'&&!s.existing&&m.count>0;
 const units=s.units>0?s.units:s.bill/s.rate;
 const day=measured?m.day:units*s.share/100,night=measured?m.night:units-day;
 const production=s.kw*s.yield*30*factor;
 const direct=Math.min(day*s.overlap/100,production);
 const stored=withBattery?Math.min(Math.max(0,production-direct)*s.efficiency/100,s.battery*30,night):0;
 const savings=Math.min(s.bill,(direct+stored)*s.rate);
 const cost=s.gridCost+(withBattery?s.batteryCost:0);
 const grant=s.grantConfirmed?Math.min(s.grant,cost):0,net=cost-grant;
 const down=Math.min(s.down,net),principal=net-down,monthly=payment(principal,s.apr,s.years);
 const annual=savings*12-s.maintenance,interest=monthly*s.years*12-principal;
 const replacement=withBattery&&s.replacementYear<=s.horizon?s.replacement:0;
 const lifetime=s.bill*12*s.horizon-savings*12*s.horizon+s.maintenance*s.horizon+net+interest+replacement;
 return {day,night,production,direct,stored,savings,cost,grant,net,down,principal,monthly,interest,annual,lifetime,monthlyNet:s.bill-savings+monthly+s.maintenance/12,payback:annual>0?net/annual:null,measured};
}
