-- 1. Deduct Stock Trigger
CREATE OR REPLACE FUNCTION fn_deduct_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if stock is sufficient
    IF (SELECT stock FROM products WHERE id = NEW.product_id) < NEW.quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product ID %. Available: %, Requested: %',
            NEW.product_id,
            (SELECT stock FROM products WHERE id = NEW.product_id),
            NEW.quantity;
    END IF;

    -- Deduct stock from products table
    UPDATE products
    SET stock = stock - NEW.quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;

    -- Record the stock movement out
    INSERT INTO stock_movements (product_id, movement_type, quantity, reference_info)
    VALUES (NEW.product_id, 'OUT', NEW.quantity, 'Order Item ID: ' || NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deduct_stock
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION fn_deduct_stock();

-- 2. Check Low Stock Trigger
CREATE OR REPLACE FUNCTION fn_check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Avoid infinite loop: only alert if the stock actually went below min_stock_level during this update
    -- and wasn't already below it before this exact update.
    IF NEW.stock < NEW.min_stock_level AND OLD.stock >= OLD.min_stock_level THEN
        INSERT INTO alerts (alert_type, message)
        VALUES ('LOW_STOCK', 'Product ' || NEW.name || ' (SKU: ' || NEW.sku || ') fell below minimum stock level. Current stock: ' || NEW.stock);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_low_stock
AFTER UPDATE OF stock ON products
FOR EACH ROW
EXECUTE FUNCTION fn_check_low_stock();

-- 3. Audit Log Trigger
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_log (table_name, record_id, action, old_data, new_data)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD)::jsonb, NULL);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Prevent infinite loops or unnecessary updates: only log if data actually changed
        IF row_to_json(OLD)::jsonb = row_to_json(NEW)::jsonb THEN
            RETURN NEW;
        END IF;

        INSERT INTO audit_log (table_name, record_id, action, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_log (table_name, record_id, action, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, NULL, row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_products
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW
EXECUTE FUNCTION fn_audit_log();
