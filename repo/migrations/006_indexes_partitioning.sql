-- Alter products table to add category, attributes, and search vector
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS attributes JSONB,
ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- Update search vector based on name and category dynamically
CREATE OR REPLACE FUNCTION fn_update_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') || 
                       setweight(to_tsvector('english', coalesce(NEW.category, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_search_vector
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION fn_update_search_vector();

-- Create GIN index on the JSONB attributes column
CREATE INDEX idx_products_attributes ON products USING GIN (attributes);

-- Create a tsvector index for full-text search
CREATE INDEX idx_products_search_vector ON products USING GIN (search_vector);

-- ------------------------------------------------------------------
-- 1. Row Level Security (RLS) Example
-- ------------------------------------------------------------------
-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to view products, but only authenticated users (mocked) to modify
-- For this demo, we'll allow public 'SELECT'
CREATE POLICY select_products_policy ON products
    FOR SELECT TO public
    USING (true);

-- ------------------------------------------------------------------
-- 2. Partitioning Example: Partitioning the audit_log table by action type
-- ------------------------------------------------------------------
-- Note: In a real production scenario, we would create the table as PARTITIONED initially.
-- For this demo, we'll create a partitioned log table to demonstrate the architecture.

CREATE TABLE audit_log_partitioned (
    id SERIAL,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
) PARTITION BY LIST (action);

-- Create partitions
CREATE TABLE audit_log_inserts PARTITION OF audit_log_partitioned FOR VALUES IN ('INSERT');
CREATE TABLE audit_log_updates PARTITION OF audit_log_partitioned FOR VALUES IN ('UPDATE');
CREATE TABLE audit_log_deletes PARTITION OF audit_log_partitioned FOR VALUES IN ('DELETE');

