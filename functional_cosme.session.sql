-- Query to list all tables and their schemas in SQLite
SELECT 
    name, 
    sql 
FROM 
    sqlite_master 
WHERE 
    type='table'
    AND name IN ('users', 'products', 'reviews');

-- Query to List all data in the users table
SELECT 
    *
FROM
    users
LIMIT 10;

-- Query to List all data in the products table
SELECT 
    *
FROM
    products
LIMIT 10;

-- Query to List all data in the reviews table
SELECT 
    *
FROM
    reviews
LIMIT 10;  
