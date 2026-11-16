import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {migrate} from './migrate.mjs';
import {seed} from './seed.mjs';
import {run,reads,models,commands,resolve} from './valuation.mjs';
import {parseCsv} from './lib/csv.mjs';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'valuation-test-'));
process.env.DATABASE_URL=process.env.VALUATION_TEST_POSTGRES_URL||'';
if(process.env.DATABASE_URL&&!/valuation_test(?:\?|$)/.test(process.env.DATABASE_URL))throw Error('Test Postgres must name an empty valuation_test database');
process.env.DATA_DIR=path.join(temp,'db');process.env.OUTPUT_DIR=temp;
const db=await getDb();const seen=new Set();
const call=async(c,a=[],o={})=>{seen.add(c);return run(db,c,a,o);};
const data=(name,obj)=>{const f=path.join(temp,name+'.json');fs.writeFileSync(f,JSON.stringify(obj));return f;};
const actor='Casey Reviewer';
try{
 if(db.mode==='postgres')assert.equal((await db.query("select tablename from pg_tables where schemaname='public'")).length,0,'Test database must be empty');
 assert.equal((await migrate(db)).ran.length,1);assert.equal((await migrate(db)).ran.length,0);
 await seed(db);const before=(await db.query('select count(*) n from audit_log'))[0].n;await seed(db);assert.equal((await db.query('select count(*) n from audit_log'))[0].n,before);
 for(const name of ['help',...Object.keys(reads)])assert.ok(Array.isArray(await call(name)));
 const base=(await call('calculation-detail')).find(r=>r.code==='DEMO-001'&&r.scenario==='Base');
 assert.equal(Number(base.normalized_ebitda),640000);assert.equal(Number(base.multiples_equity),3000000);assert.equal(Number(base.book_net_assets),1200000);
 const expected=400000/1.15+450000/1.15**2+500000/1.15**3+(500000*1.025/(.15-.025))/1.15**3+150000-350000;
 assert.ok(Math.abs(Number(base.dcf_equity)-expected)<.01);
 assert.equal((await call('calculation-detail')).find(r=>r.code==='DEMO-002').dcf_equity,null);
 const sensitivity=await call('sensitivity',['DEMO-001']);assert.equal(sensitivity.length,6);const zeros=sensitivity.filter(r=>Number(r.rate_shift)===0);assert.equal(Number(zeros.find(r=>r.scenario==='Base').dcf_equity),Number(base.dcf_equity));
 const missing=await call('sensitivity',['DEMO-002']);assert.ok(missing.every(x=>x.dcf_equity===null));
 assert.ok((await call('comparables')).some(r=>r.flag.includes('Currency differs')));
 assert.ok((await call('compliance')).some(r=>r.rule==='RETENTION'));
 assert.equal((await resolve(db,'engagements','harbour components')).code,'DEMO-001');
 await assert.rejects(()=>resolve(db,'scenarios','Base'),/Ambiguous/);
 await assert.rejects(()=>call('add-engagement',[],{data:data('unauthorised',{})}),/Data is empty/);
 const eData={code:'TEST-001',name:'Test <script>alert(1)</script>',currency:'NZD',valuation_date:'2026-01-01',due_date:'2099-01-01',preparer:'Preparer',purpose:'Test',basis:'Market value',premise:'Going concern',scope:'Whole business',intended_users:'Board',independence_note:'Test assessment',retention_review:'2099-01-01'};
 await assert.rejects(()=>call('add-engagement',[],{data:data('e',eData)}),/actor/);
 const [e]=await call('add-engagement',[],{actor,data:data('e',eData)});
 const rows={
 financial:{period_end:'2025-12-31',revenue:1000,ebitda:100,cash:20,debt:30,assets:500,liabilities:50,source:'Test accounts'},
 adjustment:{period_end:'2025-12-31',name:'One-off expense',amount:10,rationale:'Test',source:'invoice',accepted:true},
 forecast:{year_no:1,cashflow:100,source:'Test forecast'},
 scenario:{name:'Test Base',discount_rate:.15,terminal_growth:.02,ebitda_multiple:5,rationale:'Test assumptions'},
 comparable:{name:'Test Comparable',observed_on:'2025-01-01',currency:'NZD',enterprise_value:500,ebitda:100,source:'Test source',selection_note:'Test',included:true},
 evidence:{name:'Test evidence',source:'Test source',observed_on:'2025-01-01',review_due:'2099-01-01',owner:'Preparer'},
 action:{name:'Test action',owner:'Preparer',due_date:'2099-01-01'}
 };
 const ids={};
 for(const [kind,obj] of Object.entries(rows)){const [row]=await call('add-'+kind,[e.code],{actor,data:data(kind,obj)});ids[kind]=row.id;const first=Object.keys(obj)[0];await call('edit-'+kind,[row.id],{actor,data:data('edit-'+kind,{[first]:obj[first]})});}
 await call('edit-engagement',[e.code],{actor,data:data('edit-e',{purpose:'Updated purpose'})});
 await call('close-action',[ids.action],{actor,note:'Evidence received'});
 let current=await resolve(db,'engagements',e.code);
 await assert.rejects(()=>call('review',[e.code],{actor:'Preparer',revision:String(current.revision),decision:'accepted',note:'Same person'}),/independent/);
 await assert.rejects(()=>call('review',[e.code],{actor,revision:'1',decision:'accepted',note:'Old revision'}),/stale/);
 await call('review',[e.code],{actor,revision:String(current.revision),decision:'accepted',note:'Reviewed entered assumptions'});
 assert.ok(!(await call('compliance')).some(r=>r.code===e.code&&r.rule==='REVIEW'));
 await call('edit-financial',[ids.financial],{actor,data:data('change-earnings',{ebitda:120})});
 assert.ok((await call('compliance')).some(r=>r.code===e.code&&r.rule==='REVIEW'));
 await assert.rejects(()=>call('edit-scenario',[ids.scenario],{actor,data:data('bad-rate',{terminal_growth:.2})}),/check constraint/);
 await assert.rejects(()=>call('edit-financial',[ids.financial],{actor,data:data('bad-cash',{cash:-2})}),/check constraint/);
 await assert.rejects(()=>call('edit-evidence',[ids.evidence],{actor,data:data('bad-date',{review_due:'2026-02-30'})}),/Invalid date/);
 await assert.rejects(()=>call('edit-engagement',[e.code],{actor,data:data('bad-field',{revision:1})}),/Unknown field/);
 await assert.rejects(()=>db.query("update reviews set note='rewrite'"),/append-only/);
 await assert.rejects(()=>db.query('delete from audit_log'),/append-only/);
 const csv=path.join(temp,'financials.csv');const header='Engagement,Period End,Revenue,EBITDA,Cash,Debt,Assets,Liabilities,Source\r\n';
 const mapping=path.join(REPO_ROOT,'examples/financials-mapping.json');
 const valid='TEST-001,2025-12-31,2000,200,20,30,500,50,"Test, with comma"\r\n';fs.writeFileSync(csv,header+valid);
 const pre=await resolve(db,'engagements',e.code);
 await call('import',['valusource',csv],{actor,mapping,'dry-run':true});
 assert.equal((await resolve(db,'engagements',e.code)).revision,pre.revision);
 assert.equal(Number((await db.query('select ebitda from financials where id=$1',[ids.financial]))[0].ebitda),120);
 await call('import',['valusource',csv],{actor,mapping});
 const post=(await resolve(db,'engagements',e.code)).revision;
 assert.equal((await call('import',['valusource',csv],{actor,mapping}))[0].state,'already imported');
 assert.equal((await resolve(db,'engagements',e.code)).revision,post);
 const original=await db.query('select original_base64 from import_batches');assert.equal(Buffer.from(original[0].original_base64,'base64').toString(),header+valid);
 const bad=path.join(temp,'bad.csv');fs.writeFileSync(bad,header+valid.replace(',200,',',300,')+'TEST-001,2024-12-31,1000,100,-5,30,500,50,Bad cash\n');
 await assert.rejects(()=>call('import',['valusource',bad],{actor,mapping}),/check constraint/);
 assert.equal(Number((await db.query('select ebitda from financials where id=$1',[ids.financial]))[0].ebitda),200);
 assert.equal((await resolve(db,'engagements',e.code)).revision,post);
 fs.writeFileSync(bad,header+valid+valid);await assert.rejects(()=>call('import',['valusource',bad],{actor,mapping}),/Duplicate/);
 assert.throws(()=>parseCsv('A,A\n1,2'),/unique/);assert.throws(()=>parseCsv('A,B\n"bad,2'),/unclosed/);assert.equal(parseCsv('\uFEFFA,B\r\n"two\nlines","doubled ""quote"""')[0].B,'doubled "quote"');
 for(const command of ['weekly-review','draft-request']){const [out]=await call(command,[e.code]);assert.ok(fs.readFileSync(out.file,'utf8').includes('Draft'));}
 const exp=path.join(temp,'export');await call('export',[exp]);const manifest=JSON.parse(fs.readFileSync(path.join(exp,'manifest.json')));assert.equal(Object.keys(manifest.counts).length,11);
 for(const [t,n] of Object.entries(manifest.counts))assert.equal(JSON.parse(fs.readFileSync(path.join(exp,t+'.json'))).length,n);
 await assert.rejects(()=>call('export',[exp]),/must not exist/);
 assert.equal(seen.size,commands.length,`Unexercised commands: ${commands.filter(c=>!seen.has(c))}`);
 await db.close();
 for(const script of ['view','docs']){const res=spawnSync(process.execPath,[`scripts/${script}.mjs`],{cwd:REPO_ROOT,env:process.env,encoding:'utf8'});assert.equal(res.status,0,res.stderr);}
 const report=fs.readdirSync(path.join(temp,'docs-out','valuation-workpaper')).find(f=>f.endsWith(e.id+'.html'));const html=fs.readFileSync(path.join(temp,'docs-out','valuation-workpaper',report),'utf8');assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>alert(1)</script>'));assert.ok(html.includes('DRAFT valuation workpaper'));
 const cli=spawnSync(process.execPath,['scripts/valuation.mjs','scenarios','--json'],{cwd:REPO_ROOT,env:process.env,encoding:'utf8'});assert.equal(cli.status,0,cli.stderr);assert.ok(JSON.parse(cli.stdout).length>=3);
 const amb=spawnSync(process.execPath,['scripts/valuation.mjs','edit-scenario','Base','--actor=Casey',`--data=${data('amb',{rationale:'Test'})}`],{cwd:REPO_ROOT,env:process.env,encoding:'utf8'});assert.equal(amb.status,1);assert.match(amb.stderr,/Ambiguous/);
 console.log(`PASS: ${commands.length} CLI commands; formula oracle, missing forecasts, review invalidation, atomic import, dry run, audit immutability, documents, HTML escaping and export counts (${db.mode})`);
}catch(e){try{await db.close();}catch{}throw e;}finally{fs.rmSync(temp,{recursive:true,force:true});}
