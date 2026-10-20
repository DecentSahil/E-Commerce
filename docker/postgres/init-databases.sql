SELECT 'CREATE DATABASE ecommerce_auth_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ecommerce_auth_db')\gexec

SELECT 'CREATE DATABASE ecommerce_user_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ecommerce_user_db')\gexec

SELECT 'CREATE DATABASE ecommerce_product_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ecommerce_product_db')\gexec

SELECT 'CREATE DATABASE ecommerce_order_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ecommerce_order_db')\gexec

SELECT 'CREATE DATABASE ecommerce_cart_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ecommerce_cart_db')\gexec

SELECT 'CREATE DATABASE ecommerce_wishlist_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ecommerce_wishlist_db')\gexec

SELECT 'CREATE DATABASE ecommerce_notification_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ecommerce_notification_db')\gexec
