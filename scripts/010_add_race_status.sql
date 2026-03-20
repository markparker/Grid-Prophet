-- Add status column to races table to track scheduled, completed, and canceled races
ALTER TABLE races ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled' NOT NULL;

-- Create an index for faster filtering
CREATE INDEX IF NOT EXISTS idx_races_status ON races(status);

-- Add a check constraint to ensure valid status values
ALTER TABLE races ADD CONSTRAINT check_race_status CHECK (status IN ('scheduled', 'completed', 'canceled'));

-- Add a comment to explain the column
COMMENT ON COLUMN races.status IS 'Race status: scheduled, completed, or canceled. Users can only predict on scheduled races.';

-- Update the predictions queries to exclude canceled races (this will be enforced at the application level)
-- For reference: WHERE races.status = 'scheduled' AND race_date > NOW()
