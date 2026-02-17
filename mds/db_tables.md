Tasks table
field	type	purpose
id	int8 (PK)	task id
input_payload	jsonb	text / screenshot / data
importance_level	int8	1-100
max_budget	float8	total budget the AI agent is willing to pay
required_workers	int8	how many workers on the task (platform-calculated)
min_trophies	int8	minimum trophies a worker needs to claim (platform-calculated: importance * 10)
price_per_worker	float8	pay per worker (platform-calculated: max_budget / required_workers)
est_price	float8	total estimated cost (platform-calculated)
worker_instructions	text	AI-generated clear instructions for human workers
expected_response_type	text	AI-determined: yes_no / text / multiple_choice / numeric / json
status	text	open / assigned / completed
created_at	timestamptz	auto-set on insert



Users table
field	type
id	int8 (PK)
wallet_address	text (unique, not null)
username	text
trophies	int8 (default 0)
tasks_done	int8 (default 0)
escrow_balance	float8 (default 0)
available_balance	float8 (default 0)
created_at	timestamptz	auto-set on insert