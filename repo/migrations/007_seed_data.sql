INSERT INTO products (name, sku, price, stock, min_stock_level, category, attributes) VALUES
('iPhone 15 Pro', 'APPL-IP15P', 45000.00, 50, 10, 'Electronics', '{"color": "titanium", "storage": "256GB"}'),
('Samsung Galaxy S24', 'SAMS-GS24', 38000.00, 30, 10, 'Electronics', '{"color": "black", "storage": "128GB"}'),
('Mechanical Keyboard', 'PERI-MK100', 2500.00, 8, 10, 'Peripherals', '{"switch": "red", "layout": "TKL"}'),
('USB-C Hub 7-in-1', 'PERI-HUB7', 850.00, 3, 10, 'Peripherals', '{"ports": 7}'),
('27-inch 4K Monitor', 'DISP-4K27', 12000.00, 15, 10, 'Displays', '{"resolution": "4K", "hz": 60}');

-- Add demo user
INSERT INTO users (id, email, password) VALUES (1, 'demo@example.com', 'demo123');
