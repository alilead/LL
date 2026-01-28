#!/bin/bash

# Database credentials from .env file
DB_USER="httpdvic1_admin"
DB_PASS="JVI~dEtn6#gs"
DB_NAME="leadlabv2"
DUMP_FILE="../leadlabv2_2025-02-26_21-48-04.sql"

echo "WARNING: This script will delete ALL data from the database '$DB_NAME'."
echo "Press CTRL+C now to cancel or ENTER to continue..."
read

# Disable foreign key checks and create drop statements for all tables
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << EOF
SET FOREIGN_KEY_CHECKS = 0;
SET @tables = NULL;
SELECT GROUP_CONCAT(table_schema, '.', table_name) INTO @tables
FROM information_schema.tables
WHERE table_schema = '$DB_NAME';

SET @tables = CONCAT('DROP TABLE IF EXISTS ', @tables);
PREPARE stmt FROM @tables;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET FOREIGN_KEY_CHECKS = 1;
EOF

echo "All tables have been dropped. Now importing database dump..."

# Import the SQL dump
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$DUMP_FILE"

# Check if import was successful
if [ $? -eq 0 ]; then
  echo "Database import completed successfully!"
  
  # Show tables after import
  echo "Tables in the database after import:"
  mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;" | cat
else
  echo "Error: Database import failed!"
fi

echo "Done." 