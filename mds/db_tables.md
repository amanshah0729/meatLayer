Tasks table (minimal)
field	type	purpose
id	uuid (PK)	task id
input_payload	jsonb	text / screenshot / data
importance_level	int	1-100 
required_workers	int how many workers on the task
estimated_price	numeric	platform-calculated
status	text	open / assigned / completed
created_at	timestamp	tracking



Minimal users table (single-score version)
field	type
id	uuid (PK)
trophies	int
tasks_completed	int
escrow_balance	numeric
available_balance	numeric
created_at	timestamp