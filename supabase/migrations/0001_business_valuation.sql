-- Trusted-operator valuation workbench; no shared user authentication is implied.
create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=clock_timestamp(); return new; end $$;
create table engagements (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), code text not null unique, name text not null, currency text not null check(currency in ('NZD','AUD','USD','GBP','EUR')), valuation_date date not null, due_date date not null, preparer text not null, purpose text not null, basis text not null, premise text not null, scope text not null, intended_users text not null, independence_note text not null default '', retention_review date not null, revision integer not null default 1, status text not null default 'open' check(status in ('open','closed')));
alter table engagements enable row level security;
revoke all on engagements from public;
create trigger touch before update on engagements for each row execute function touch_updated_at();
create table financials (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), engagement_id uuid not null references engagements(id), period_end date not null, revenue numeric(18,2) not null, ebitda numeric(18,2) not null, cash numeric(18,2) not null check(cash>=0), debt numeric(18,2) not null check(debt>=0), assets numeric(18,2) not null check(assets>=0), liabilities numeric(18,2) not null check(liabilities>=0), source text not null check(length(trim(source))>0), unique(engagement_id,period_end));
alter table financials enable row level security;
revoke all on financials from public;
create trigger touch before update on financials for each row execute function touch_updated_at();
create table adjustments (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), engagement_id uuid not null references engagements(id), period_end date not null, name text not null, amount numeric(18,2) not null, rationale text not null check(length(trim(rationale))>0), source text not null check(length(trim(source))>0), accepted boolean not null default false);
alter table adjustments enable row level security;
revoke all on adjustments from public;
create trigger touch before update on adjustments for each row execute function touch_updated_at();
create table forecasts (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), engagement_id uuid not null references engagements(id), year_no integer not null check(year_no between 1 and 10), cashflow numeric(18,2) not null, source text not null check(length(trim(source))>0), unique(engagement_id,year_no));
alter table forecasts enable row level security;
revoke all on forecasts from public;
create trigger touch before update on forecasts for each row execute function touch_updated_at();
create table scenarios (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), engagement_id uuid not null references engagements(id), name text not null, discount_rate numeric(8,6) not null check(discount_rate>0 and discount_rate<1), terminal_growth numeric(8,6) not null check(terminal_growth>-1 and terminal_growth<discount_rate), ebitda_multiple numeric(8,3) not null check(ebitda_multiple>0), rationale text not null check(length(trim(rationale))>0), unique(engagement_id,name));
alter table scenarios enable row level security;
revoke all on scenarios from public;
create trigger touch before update on scenarios for each row execute function touch_updated_at();
create table comparables (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), engagement_id uuid not null references engagements(id), name text not null, observed_on date not null, currency text not null check(currency in ('NZD','AUD','USD','GBP','EUR')), enterprise_value numeric(18,2) not null check(enterprise_value>0), ebitda numeric(18,2) not null check(ebitda>0), source text not null check(length(trim(source))>0), selection_note text not null, included boolean not null default false);
alter table comparables enable row level security;
revoke all on comparables from public;
create trigger touch before update on comparables for each row execute function touch_updated_at();
create table evidence (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), engagement_id uuid not null references engagements(id), name text not null, source text not null check(length(trim(source))>0), observed_on date not null, review_due date not null, owner text not null);
alter table evidence enable row level security;
revoke all on evidence from public;
create trigger touch before update on evidence for each row execute function touch_updated_at();
create table reviews (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), engagement_id uuid not null references engagements(id), revision integer not null, reviewer text not null, decision text not null check(decision in ('accepted','revise')), note text not null check(length(trim(note))>0));
alter table reviews enable row level security;
revoke all on reviews from public;
create trigger touch before update on reviews for each row execute function touch_updated_at();
create table actions (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), engagement_id uuid not null references engagements(id), name text not null, owner text not null, due_date date not null, status text not null default 'open' check(status in ('open','closed')), closure_note text not null default '');
alter table actions enable row level security;
revoke all on actions from public;
create trigger touch before update on actions for each row execute function touch_updated_at();
create table import_batches (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), fingerprint text not null unique, filename text not null, original_base64 text not null, mapping jsonb not null, row_count integer not null);
alter table import_batches enable row level security;
revoke all on import_batches from public;
create trigger touch before update on import_batches for each row execute function touch_updated_at();
create table audit_log (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), entity text not null, record_id uuid not null, operation text not null, actor text not null, old_row jsonb, new_row jsonb);
alter table audit_log enable row level security;
revoke all on audit_log from public;
create trigger touch before update on audit_log for each row execute function touch_updated_at();

create function audit_change() returns trigger language plpgsql as $$ begin
 insert into audit_log(entity,record_id,operation,actor,old_row,new_row) values(TG_TABLE_NAME,coalesce(new.id,old.id),TG_OP,coalesce(nullif(current_setting('app.actor',true),''),'database operator'),case when TG_OP='INSERT' then null else to_jsonb(old) end,case when TG_OP='DELETE' then null else to_jsonb(new) end); return coalesce(new,old); end $$;
create function immutable_record() returns trigger language plpgsql as $$ begin raise exception 'Evidence history is append-only'; end $$;
create function bump_engagement() returns trigger language plpgsql as $$ begin
 update engagements set revision=revision+1 where id=coalesce(new.engagement_id,old.engagement_id); return coalesce(new,old); end $$;
create function revise_engagement() returns trigger language plpgsql as $$ begin new.revision=old.revision+1; return new; end $$;
create trigger revise before update on engagements for each row execute function revise_engagement();
create function review_guard() returns trigger language plpgsql as $$ declare e engagements; begin
 select * into e from engagements where id=new.engagement_id;
 if new.revision<>e.revision then raise exception 'Review revision is stale'; end if;
 if lower(trim(new.reviewer))=lower(trim(e.preparer)) then raise exception 'Review must be independent of preparer'; end if;
 return new; end $$;
create trigger guard before insert on reviews for each row execute function review_guard();
create trigger audit after insert or update or delete on engagements for each row execute function audit_change();
create trigger audit after insert or update or delete on financials for each row execute function audit_change();
create trigger revision after insert or update or delete on financials for each row execute function bump_engagement();
create trigger audit after insert or update or delete on adjustments for each row execute function audit_change();
create trigger revision after insert or update or delete on adjustments for each row execute function bump_engagement();
create trigger audit after insert or update or delete on forecasts for each row execute function audit_change();
create trigger revision after insert or update or delete on forecasts for each row execute function bump_engagement();
create trigger audit after insert or update or delete on scenarios for each row execute function audit_change();
create trigger revision after insert or update or delete on scenarios for each row execute function bump_engagement();
create trigger audit after insert or update or delete on comparables for each row execute function audit_change();
create trigger revision after insert or update or delete on comparables for each row execute function bump_engagement();
create trigger audit after insert or update or delete on evidence for each row execute function audit_change();
create trigger revision after insert or update or delete on evidence for each row execute function bump_engagement();
create trigger audit after insert or update or delete on reviews for each row execute function audit_change();
create trigger immutable before update or delete on reviews for each row execute function immutable_record();
create trigger audit after insert or update or delete on actions for each row execute function audit_change();
create trigger audit after insert or update or delete on import_batches for each row execute function audit_change();
create trigger immutable before update or delete on import_batches for each row execute function immutable_record();
create trigger immutable before update or delete on audit_log for each row execute function immutable_record();

create view v_financials as
select e.id engagement_id,e.code,e.name,e.currency,e.valuation_date,f.id financial_id,f.period_end,f.revenue,f.ebitda,f.cash,f.debt,f.assets,f.liabilities,f.source,
 coalesce((select sum(a.amount) from adjustments a where a.engagement_id=e.id and a.period_end=f.period_end and a.accepted),0) adjustment_amount,
 f.ebitda+coalesce((select sum(a.amount) from adjustments a where a.engagement_id=e.id and a.period_end=f.period_end and a.accepted),0) normalized_ebitda
from engagements e left join lateral(select * from financials where engagement_id=e.id and period_end<=e.valuation_date order by period_end desc limit 1) f on true;
create view v_valuations as
select e.id engagement_id,e.code,e.name,e.currency,s.id scenario_id,s.name scenario,
 f.normalized_ebitda,s.discount_rate,s.terminal_growth,s.ebitda_multiple,
 round(f.normalized_ebitda*s.ebitda_multiple,2) multiples_enterprise,
 round(f.normalized_ebitda*s.ebitda_multiple+f.cash-f.debt,2) multiples_equity,
 round(f.assets-f.liabilities,2) book_net_assets,
 case when fc.n=fc.last_year and fc.n>0 and f.financial_id is not null then
 round(fc.pv+(fc.terminal_cashflow*(1+s.terminal_growth)/(s.discount_rate-s.terminal_growth))/power(1+s.discount_rate,fc.last_year),2) end dcf_enterprise,
 case when fc.n=fc.last_year and fc.n>0 and f.financial_id is not null then
 round(fc.pv+(fc.terminal_cashflow*(1+s.terminal_growth)/(s.discount_rate-s.terminal_growth))/power(1+s.discount_rate,fc.last_year)+f.cash-f.debt,2) end dcf_equity,
 case when f.financial_id is null then 'Missing financials' when fc.n=0 or fc.n<>fc.last_year then 'Forecast years incomplete' else 'Draft calculation' end calculation_state
from engagements e join scenarios s on s.engagement_id=e.id join v_financials f on f.engagement_id=e.id
cross join lateral(select count(*) n,max(year_no) last_year,sum(cashflow/power(1+s.discount_rate,year_no)) pv,
 (array_agg(cashflow order by year_no desc))[1] terminal_cashflow from forecasts where engagement_id=e.id) fc;
create view v_comparables as select c.*,e.code,e.currency engagement_currency,
 round(c.enterprise_value/c.ebitda,3) implied_multiple,
 case when c.currency<>e.currency then 'Currency differs: no automatic conversion' when c.observed_on>e.valuation_date then 'After valuation date' when c.observed_on<e.valuation_date-730 then 'Older than two years: review' when c.included then 'Selected by operator' else 'Not selected' end flag
from comparables c join engagements e on e.id=c.engagement_id;
create view v_compliance as
select id engagement_id,code,'SCOPE' rule,'Record purpose, basis, premise, scope and intended users' finding,'APES 225 sections 4 and 5' source from engagements where trim(purpose)='' or trim(basis)='' or trim(premise)='' or trim(scope)='' or trim(intended_users)=''
union all select id,code,'INDEPENDENCE','Independence assessment missing','APES 225 section 3' from engagements where trim(independence_note)=''
union all select e.id,e.code,'EVIDENCE','Evidence review overdue: '||v.name,'Practice rule; APES 225 section 6' from engagements e join evidence v on e.id=v.engagement_id where v.review_due<current_date
union all select e.id,e.code,'SOURCE','No evidence records','APES 225 section 6' from engagements e where not exists(select 1 from evidence where engagement_id=e.id)
union all select e.id,e.code,'REVIEW','Current revision needs independent review','Practice review policy, not statutory certification' from engagements e where not coalesce((select r.decision='accepted' and r.revision=e.revision from reviews r where r.engagement_id=e.id order by r.created_at desc,r.id desc limit 1),false)
union all select id,code,'RETENTION','Review the need to retain personal information','NZ Privacy Act IPP 9; date set by operator' from engagements where retention_review<current_date
union all select e.id,e.code,'FINANCIALS','No financial period on or before valuation date','Practice input rule' from engagements e join v_financials f on f.engagement_id=e.id where f.financial_id is null;
create view v_attention as
select e.id engagement_id,e.code,e.name,'Engagement overdue' reason,e.due_date due_date,e.preparer owner from engagements e where e.status='open' and e.due_date<current_date
union all select e.id,e.code,a.name,'Open action',a.due_date,a.owner from engagements e join actions a on a.engagement_id=e.id where a.status='open' and a.due_date<=current_date+7
union all select e.id,e.code,v.name,'Evidence review',v.review_due,v.owner from engagements e join evidence v on v.engagement_id=e.id where v.review_due<=current_date+7;
create view v_engagements as select e.*,
 (select count(*) from v_compliance c where c.engagement_id=e.id) findings,
 (select count(*) from actions a where a.engagement_id=e.id and a.status='open') open_actions,
 (select max(created_at) from reviews r where r.engagement_id=e.id) last_review
from engagements e;
