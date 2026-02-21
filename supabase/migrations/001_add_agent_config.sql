-- Add agent_config JSONB column to store persona, confidence_threshold, etc.
ALTER TABLE agents ADD COLUMN IF NOT EXISTS agent_config JSONB DEFAULT '{}';
