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
