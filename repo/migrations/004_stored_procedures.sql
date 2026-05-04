CREATE OR REPLACE PROCEDURE sp_create_order(
    p_user_id VARCHAR(255),
    p_items JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id INTEGER;
    v_total_amount NUMERIC(10, 2) := 0;
    v_item RECORD;
    v_product_price NUMERIC(10, 2);
    v_product_stock INTEGER;
BEGIN
    -- Insert initial order with the user id mapped to the customer_name column
    INSERT INTO orders (customer_name, status, total_amount)
    VALUES (p_user_id, 'PENDING', 0)
    RETURNING id INTO v_order_id;

    -- Loop through items in the JSON array: [{"product_id": 1, "quantity": 2}, ...]
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id INT, quantity INT)
    LOOP
        -- Lock the row and get stock and price to prevent concurrent race conditions
        SELECT price, stock INTO v_product_price, v_product_stock
        FROM products
        WHERE id = v_item.product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product ID % not found', v_item.product_id;
        END IF;

        IF v_product_stock < v_item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product_id=%', v_item.product_id;
        END IF;

        -- Insert order item. The fn_deduct_stock trigger will automatically subtract stock.
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (v_order_id, v_item.product_id, v_item.quantity, v_product_price);

        -- Accumulate total price
        v_total_amount := v_total_amount + (v_product_price * v_item.quantity);
    END LOOP;

    -- Update order total amount
    UPDATE orders
    SET total_amount = v_total_amount,
        status = 'COMPLETED'
    WHERE id = v_order_id;

    -- The outer transaction handles the COMMIT
END;
$$;
