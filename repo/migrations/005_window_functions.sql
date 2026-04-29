CREATE OR REPLACE VIEW v_sales_trend_30days AS
WITH daily_revenue AS (
    SELECT 
        DATE(created_at) as sale_date,
        SUM(total_amount) as daily_revenue
    FROM orders
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(created_at)
)
SELECT 
    sale_date,
    daily_revenue,
    LAG(daily_revenue) OVER (ORDER BY sale_date) as prev_day_revenue,
    LEAD(daily_revenue) OVER (ORDER BY sale_date) as next_day_revenue,
    RANK() OVER (ORDER BY daily_revenue DESC) as revenue_rank
FROM daily_revenue;
