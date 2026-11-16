#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';
import {table} from './lib/format.mjs';

export const models={
 engagement:{table:'engagements',fields:['code','name','currency','valuation_date','due_date','preparer','purpose','basis','premise','scope','intended_users','independence_note','retention_review','status']},
 financial:{table:'financials',fields:['period_end','revenue','ebitda','cash','debt','assets','liabilities','source']},
 adjustment:{table:'adjustments',fields:['period_end','name','amount','rationale','source','accepted']},
 forecast:{table:'forecasts',fields:['year_no','cashflow','source']},
 scenario:{table:'scenarios',fields:['name','discount_rate','terminal_growth','ebitda_multiple','rationale']},
 comparable:{table:'comparables',fields:['name','observed_on','currency','enterprise_value','ebitda','source','selection_note','included']},
 evidence:{table:'evidence',fields:['name','source','observed_on','review_due','owner']},
 action:{table:'actions',fields:['name','owner','due_date','status','closure_note']}
};
export const reads={
 engagements:'select code,name,currency,valuation_date,due_date,revision,findings,open_actions from v_engagements order by due_date,code',
 'engagement-detail':'select * from v_engagements',
 financials:'select * from v_financials',
 'financial-history':'select f.*,e.code,e.currency from financials f join engagements e on e.id=f.engagement_id order by e.code,f.period_end',
 adjustments:'select a.*,e.code from adjustments a join engagements e on e.id=a.engagement_id',
 forecasts:'select f.*,e.code from forecasts f join engagements e on e.id=f.engagement_id order by e.code,year_no',
 scenarios:'select s.*,e.code from scenarios s join engagements e on e.id=s.engagement_id',
 valuations:'select code,currency,scenario,multiples_equity,dcf_equity,book_net_assets,calculation_state from v_valuations order by code,scenario',
 'calculation-detail':'select * from v_valuations',
 comparables:'select name,code,currency,implied_multiple,included,flag from v_comparables order by code,name',
 evidence:'select v.*,e.code from evidence v join engagements e on e.id=v.engagement_id',
 reviews:'select r.*,e.code,e.revision current_revision,(r.revision=e.revision) current from reviews r join engagements e on e.id=r.engagement_id order by r.created_at desc',
 actions:'select a.*,e.code from actions a join engagements e on e.id=a.engagement_id order by a.due_date',
 attention:'select code,name,reason,due_date,owner from v_attention order by due_date,code',
 compliance:'select code,rule,finding,source from v_compliance order by code,rule',
 'review-queue':"select code,name,revision,findings,due_date from v_engagements where status='open' and exists(select 1 from v_compliance where engagement_id=v_engagements.id and rule='REVIEW') order by due_date",
 'source-gaps':"select code,rule,finding from v_compliance where rule in ('EVIDENCE','SOURCE','FINANCIALS') order by code,rule",
 audit:'select * from audit_log order by created_at desc,id',
 imports:'select id,created_at,fingerprint,filename,row_count from import_batches order by created_at desc'
};
export const commands=['help',...Object.keys(reads),...Object.keys(models).flatMap(n=>['add-'+n,'edit-'+n]),'review','close-action','sensitivity','weekly-review','draft-request','import','export'];
const numeric=new Set(['revenue','ebitda','cash','debt','assets','liabilities','amount','year_no','cashflow','discount_rate','terminal_growth','ebitda_multiple','enterprise_value']);
const dates=new Set(['valuation_date','due_date','retention_review','period_end','observed_on','review_due']);
function validate(data,fields){
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Data must be an object');
 if(!Object.keys(data).length)throw Error('Data is empty');
 for(const [k,v] of Object.entries(data)){
  if(!fields.includes(k))throw Error('Unknown field: '+k);
  if(numeric.has(k)){if(typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>1e12)throw Error(k+' must be a finite number no larger than 1e12');if(k==='year_no'&&!Number.isInteger(v))throw Error('year_no must be an integer');}
  else if(['accepted','included'].includes(k)){if(typeof v!=='boolean')throw Error(k+' must be boolean');}
  else if(typeof v!=='string')throw Error(k+' must be text');
  if(dates.has(k)&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v))throw Error('Invalid date: '+k);
 }
 return data;
}
export async function resolve(db,t,ref){
 if(!ref)throw Error('Supply a record code, name or UUID prefix');
 const cols=t==='engagements'?['name','code']:['financials','forecasts'].includes(t)?[]:['name'];
 const clauses=['id::text ilike $1',...cols.map(k=>`lower(${k})=lower($2)`)].join(' or ');
 const rows=await db.query(`select * from ${t} where ${clauses} order by id`,cols.length?[ref+'%',ref]:[ref+'%']);
 if(rows.length!==1)throw Error(`${rows.length?'Ambiguous':'No match'}: ${ref}\n`+rows.map(r=>`${r.id} ${r.code||''} ${r.name||''}`).join('\n'));
 return rows[0];
}
const jsonFile=f=>{if(!f)throw Error('Supply --data=<JSON file>');return JSON.parse(fs.readFileSync(path.resolve(f),'utf8'));};
async function transaction(db,actor,fn){
 if(typeof actor!=='string'||!actor.trim())throw Error('Mutation requires --actor=<operator name>');
 await db.exec('BEGIN');
 try{await db.query("select set_config('app.actor',$1,true)",[actor]);const value=await fn();await db.exec('COMMIT');return value;}catch(e){await db.exec('ROLLBACK');throw e;}
}
export function human(rows){
 if(!Array.isArray(rows))return JSON.stringify(rows,null,2);
 if(!rows.length)return '  (none)';
 return table(rows,Object.keys(rows[0]).map(k=>({key:k,label:k.replaceAll('_',' '),width:80,format:v=>v===null?'unknown':typeof v==='object'?JSON.stringify(v):v})));
}
const privateWrite=(file,content)=>{fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});fs.writeFileSync(file,content,{flag:'wx',mode:0o600});return file;};
function draft(name,content){return privateWrite(path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts',`${name}-${Date.now()}-${randomUUID().slice(0,8)}.md`),content);}

async function importFinancials(db,args,opts){
 if(args[0]!=='valusource'||!args[1])throw Error('Use import valusource <prepared CSV> --mapping=<profile.json> --actor=<name> [--dry-run]');
 if(!opts.mapping)throw Error('A reviewed --mapping profile is required; no universal ValuSource CSV layout is assumed');
 const bytes=fs.readFileSync(args[1]);
 const mapping=jsonFile(opts.mapping);
 const fields=['engagement',...models.financial.fields];
 if(Object.keys(mapping).length!==fields.length||fields.some(k=>typeof mapping[k]!=='string'||!mapping[k]))throw Error('Mapping must name every financial field and engagement');
 if(new Set(Object.values(mapping)).size!==fields.length)throw Error('Mapping cannot reuse columns');
 const rows=parseCsv(bytes.toString('utf8'));
 if(!rows.length)throw Error('CSV has no data rows');
 const prepared=rows.map((row,i)=>{
  const data={};for(const field of fields){if(!(mapping[field] in row)||row[mapping[field]].trim()==='')throw Error(`Row ${i+2}: missing ${mapping[field]}`); const value=row[mapping[field]].trim();
   if(numeric.has(field)&&!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value))throw Error(`Row ${i+2}: ${field} must be a plain decimal without symbols`);
   data[field]=numeric.has(field)?Number(value):value;}
  const engagement=data.engagement;delete data.engagement;validate(data,models.financial.fields);return {engagement,data};
 });
 const fingerprint=createHash('sha256').update(bytes).update(JSON.stringify(Object.fromEntries(Object.entries(mapping).sort()))).digest('hex');
 return transaction(db,opts.actor,async()=>{
  const old=await db.query('select id,row_count from import_batches where fingerprint=$1',[fingerprint]);
  if(old.length)return [{state:'already imported',rows:old[0].row_count,batch:old[0].id}];
  const keys=new Set();
  for(const row of prepared){
   const e=await resolve(db,'engagements',row.engagement);row.id=e.id;
   const key=e.id+row.data.period_end;if(keys.has(key))throw Error('Duplicate engagement and financial period in CSV');keys.add(key);
  }
  // A savepoint exercises all database constraints even during a dry run.
  await db.exec('SAVEPOINT import_rows');
  for(const row of prepared){const fields=Object.keys(row.data);await db.query(`insert into financials(engagement_id,${fields.join(',')}) values(${[row.id,...Object.values(row.data)].map((_,i)=>'$'+(i+1)).join(',')}) on conflict(engagement_id,period_end) do update set ${fields.filter(k=>k!=='period_end').map(k=>`${k}=excluded.${k}`).join(',')}`,[row.id,...Object.values(row.data)]);}
  if(opts['dry-run']){await db.exec('ROLLBACK TO SAVEPOINT import_rows');return [{state:'dry run: validated, no records changed',rows:prepared.length}];}
  const [batch]=await db.query('insert into import_batches(fingerprint,filename,original_base64,mapping,row_count) values($1,$2,$3,$4,$5) returning id',[fingerprint,path.basename(args[1]),bytes.toString('base64'),JSON.stringify(mapping),prepared.length]);
  return [{state:'imported',rows:prepared.length,batch:batch.id}];
 });
}

export async function run(db,command,args=[],opts={}){
 if(command==='help')return commands.map(command=>({command}));
 if(reads[command])return db.query(reads[command]);
 const match=/^(add|edit)-(.+)$/.exec(command);
 if(match&&models[match[2]]){
  const [_,op,kind]=match;const m=models[kind];const data=validate(jsonFile(opts.data),m.fields);
  return transaction(db,opts.actor,async()=>{
   if(op==='add'){
    if(kind!=='engagement')data.engagement_id=(await resolve(db,'engagements',args[0])).id;
    const keys=Object.keys(data);return db.query(`insert into ${m.table}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(data));
   }
   const row=await resolve(db,m.table,args[0]);const keys=Object.keys(data);
   return db.query(`update ${m.table} set ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')} where id=$${keys.length+1} returning *`,[...Object.values(data),row.id]);
  });
 }
 if(command==='close-action')return transaction(db,opts.actor,async()=>{
  if(!opts.note?.trim())throw Error('--note is required');const a=await resolve(db,'actions',args[0]);return db.query("update actions set status='closed',closure_note=$1 where id=$2 returning *",[opts.note,a.id]);
 });
 if(command==='review')return transaction(db,opts.actor,async()=>{
  const e=await resolve(db,'engagements',args[0]);await db.query('select id from engagements where id=$1 for update',[e.id]);
  if(!/^\d+$/.test(String(opts.revision||'')))throw Error('--revision=<reviewed revision> is required');
  if(opts.decision==='accepted'){
   const findings=await db.query("select rule,finding from v_compliance where engagement_id=$1 and rule<>'REVIEW'",[e.id]);
   const calculations=await db.query('select * from v_valuations where engagement_id=$1',[e.id]);
   if(findings.length||!calculations.length||calculations.some(r=>r.calculation_state!=='Draft calculation'))throw Error('Resolve evidence/input findings before accepting: '+JSON.stringify(findings));
  }
  return db.query('insert into reviews(engagement_id,revision,reviewer,decision,note) values($1,$2,$3,$4,$5) returning *',[e.id,Number(opts.revision),opts.actor,opts.decision,opts.note]);
 });
 if(command==='sensitivity'){
  const e=await resolve(db,'engagements',args[0]);
  return db.query(`select s.name scenario,e.currency,shift.rate_shift,s.discount_rate+shift.rate_shift discount_rate,s.terminal_growth,
   case when count(f.*)=max(f.year_no) and count(f.*)>0 and v.financial_id is not null then round(sum(f.cashflow/power(1+s.discount_rate+shift.rate_shift,f.year_no))+
   ((array_agg(f.cashflow order by f.year_no desc))[1]*(1+s.terminal_growth)/(s.discount_rate+shift.rate_shift-s.terminal_growth))/power(1+s.discount_rate+shift.rate_shift,max(f.year_no))+v.cash-v.debt,2) end dcf_equity
   from scenarios s join engagements e on e.id=s.engagement_id join v_financials v on v.engagement_id=e.id
   cross join (values(-0.01::numeric),(0::numeric),(0.01::numeric)) shift(rate_shift)
   left join forecasts f on f.engagement_id=e.id
   where e.id=$1 and s.discount_rate+shift.rate_shift>s.terminal_growth and s.discount_rate+shift.rate_shift>0
   group by s.id,s.name,s.discount_rate,s.terminal_growth,e.currency,shift.rate_shift,v.cash,v.debt,v.financial_id order by s.name,shift.rate_shift`,[e.id]);
 }
 if(command==='weekly-review'){
  const sections=[];for(const name of ['engagements','attention','compliance'])sections.push(`## ${name}\n\n\`\`\`text\n${human(await db.query(reads[name]))}\n\`\`\``);
  return [{file:draft('weekly-review','# Draft weekly valuation review\n\n'+sections.join('\n\n'))}];
 }
 if(command==='draft-request'){
  const e=await resolve(db,'engagements',args[0]);const actions=await db.query("select name,owner,due_date from actions where engagement_id=$1 and status='open' order by due_date",[e.id]);
  return [{file:draft('information-request',`# Draft information request: ${e.name}\n\nFor operator review. Not sent.\n\nPlease supply the evidence for these recorded open items:\n\n${human(actions)}\n`)}];
 }
 if(command==='import')return importFinancials(db,args,opts);
 if(command==='export'){
  const dir=path.resolve(args[0]||path.join(process.env.OUTPUT_DIR||REPO_ROOT,'exports',randomUUID()));
  if(fs.existsSync(dir))throw Error('Export destination must not exist');
  const data={};await db.exec('BEGIN READ ONLY');
  try{for(const t of [...Object.values(models).map(m=>m.table),'reviews','import_batches','audit_log'])data[t]=await db.query(`select * from ${t} order by id`);}finally{await db.exec('ROLLBACK');}
  fs.mkdirSync(dir,{recursive:true,mode:0o700});const counts={};
  for(const [t,rows] of Object.entries(data)){privateWrite(path.join(dir,t+'.json'),JSON.stringify(rows,null,2)+'\n');counts[t]=rows.length;}
  privateWrite(path.join(dir,'manifest.json'),JSON.stringify({format:1,created:new Date().toISOString(),counts},null,2)+'\n');
  return [{directory:dir,collections:Object.keys(counts).length,rows:Object.values(counts).reduce((a,b)=>a+b,0)}];
 }
 throw Error('Unknown command '+command+'. Use help.');
}
export function parseArgs(argv){const args=[],opts={};for(const x of argv){if(x.startsWith('--')){const i=x.indexOf('=');const k=x.slice(2,i<0?undefined:i);if(!['json','data','mapping','actor','revision','decision','note','dry-run','help'].includes(k))throw Error('Unknown option: '+k);opts[k]=i<0?true:x.slice(i+1);}else args.push(x);}return {command:opts.help?'help':args.shift()||'help',args,opts};}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{const {command,args,opts}=parseArgs(process.argv.slice(2));db=await getDb();const rows=await run(db,command,args,opts);console.log(opts.json?JSON.stringify(rows,null,2):human(rows));}catch(e){console.error(e.message);process.exitCode=1;}finally{await db?.close();}
}
