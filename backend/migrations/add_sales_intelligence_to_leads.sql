-- Add sales_intelligence column to leads table
ALTER TABLE leads ADD COLUMN sales_intelligence JSON DEFAULT NULL;

-- Add comment for the new column
ALTER TABLE leads MODIFY COLUMN sales_intelligence JSON DEFAULT NULL COMMENT 'AI-powered sales intelligence data for the lead'; 