-- Add email_guidelines column to leads table
ALTER TABLE leads ADD COLUMN email_guidelines TEXT DEFAULT NULL;

-- Add comment for the new column
ALTER TABLE leads MODIFY COLUMN email_guidelines TEXT DEFAULT NULL COMMENT 'Email communication guidelines for the lead'; 