do $$ declare a uuid; b uuid; begin
 if exists(select 1 from engagements) then return; end if;
 perform set_config('app.actor','fictional demo seed',true);
 insert into engagements(code,name,currency,valuation_date,due_date,preparer,purpose,basis,premise,scope,intended_users,independence_note,retention_review)
 values('DEMO-001','Harbour Components','NZD',current_date,current_date-3,'Mara Ellis','Shareholder planning','Market value','Going concern','Whole business, draft methods review','Board and instructed adviser','No interest recorded; verify before reliance',current_date+365) returning id into a;
 insert into engagements(code,name,currency,valuation_date,due_date,preparer,purpose,basis,premise,scope,intended_users,retention_review)
 values('DEMO-002','Southern Advisory','AUD',current_date,current_date+12,'Lee Morgan','Succession discussion','Market value','Going concern','Draft analysis','Partners',current_date-10) returning id into b;
 insert into financials(engagement_id,period_end,revenue,ebitda,cash,debt,assets,liabilities,source) values
 (a,current_date-30,4200000,600000,150000,350000,2100000,900000,'Fictional management accounts'),
 (b,current_date-30,1850000,280000,90000,40000,620000,170000,'Fictional financial statement');
 insert into adjustments(engagement_id,period_end,name,amount,rationale,source,accepted) values
 (a,current_date-30,'One-off relocation',40000,'Recorded once in reported EBITDA','Fictional invoice',true),
 (a,current_date-30,'Owner remuneration',60000,'Not yet accepted by reviewer','Fictional remuneration note',false);
 insert into forecasts(engagement_id,year_no,cashflow,source) values(a,1,400000,'Fictional board forecast'),(a,2,450000,'Fictional board forecast'),(a,3,500000,'Fictional board forecast'),(b,1,190000,'Fictional draft forecast'),(b,3,240000,'Fictional draft forecast');
 insert into scenarios(engagement_id,name,discount_rate,terminal_growth,ebitda_multiple,rationale) values
 (a,'Base',0.15,0.025,5.0,'Fictional assumptions for demo only'),(a,'Downside',0.18,0.01,4.0,'Fictional stress case'),(b,'Base',0.16,0.02,4.5,'Fictional assumptions');
 insert into comparables(engagement_id,name,observed_on,currency,enterprise_value,ebitda,source,selection_note,included) values
 (a,'Fictional Components A',current_date-90,'NZD',3200000,640000,'Fictional transaction','Similar operating profile',true),
 (a,'Fictional Components B',current_date-900,'AUD',4500000,750000,'Fictional transaction','Old and different currency',false);
 insert into evidence(engagement_id,name,source,observed_on,review_due,owner) values
 (a,'Accounts reconciliation','Fictional management accounts',current_date-30,current_date-5,'Mara Ellis'),
 (b,'Client forecast','Fictional draft forecast',current_date-25,current_date+7,'Lee Morgan');
 insert into actions(engagement_id,name,owner,due_date) values(a,'Confirm relocation adjustment','Mara Ellis',current_date-2),(b,'Obtain second-year forecast','Lee Morgan',current_date+2);
 end $$;
