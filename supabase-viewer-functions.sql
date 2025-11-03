-- Create Postgres functions for safely incrementing/decrementing viewer counts

-- Function to increment viewer count
CREATE OR REPLACE FUNCTION increment_viewer(session_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE live_sessions
  SET viewers = viewers + 1
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement viewer count (never go below 0)
CREATE OR REPLACE FUNCTION decrement_viewer(session_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE live_sessions
  SET viewers = GREATEST(viewers - 1, 0)
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_viewer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_viewer(UUID) TO authenticated;
