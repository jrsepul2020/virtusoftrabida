/*
  # Create Companies and Samples Schema for Contest Subscription System

  ## Overview
  This migration creates the database structure for a contest subscription system where companies
  can register and submit up to 10 samples for competition.

  ## New Tables

  ### `companies`
  Stores company registration information
  - `id` (uuid, primary key) - Unique identifier for each company
  - `name` (text, required) - Company name
  - `email` (text, required, unique) - Company contact email
  - `phone` (text) - Company phone number
  - `address` (text) - Company address
  - `contact_person` (text) - Name of contact person
  - `status` (text, default: 'pending') - Registration status (pending, approved, rejected)
  - `created_at` (timestamptz) - Registration timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `samples`
  Stores sample submissions from companies
  - `id` (uuid, primary key) - Unique identifier for each sample
  - `company_id` (uuid, foreign key) - Reference to the company
  - `sample_name` (text, required) - Name/description of the sample
  - `category` (text) - Sample category
  - `description` (text) - Detailed description
  - `created_at` (timestamptz) - Submission timestamp

  ## Security
  - Enable RLS on both tables
  - Public can insert companies and samples (for registration form)
  - Only authenticated users can view and manage all records (admin panel)

  ## Constraints
  - Each company must have a unique email
  - Maximum 10 samples per company enforced by check constraint
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  address text,
  contact_person text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create samples table
CREATE TABLE IF NOT EXISTS samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sample_name text NOT NULL,
  category text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_samples_company_id ON samples(company_id);

-- Function to check maximum samples per company
CREATE OR REPLACE FUNCTION check_max_samples()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM samples WHERE company_id = NEW.company_id) >= 10 THEN
    RAISE EXCEPTION 'A company can only submit a maximum of 10 samples';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for max samples validation
DROP TRIGGER IF EXISTS enforce_max_samples ON samples;
CREATE TRIGGER enforce_max_samples
  BEFORE INSERT ON samples
  FOR EACH ROW
  EXECUTE FUNCTION check_max_samples();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for companies updated_at
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies table
-- Allow public to insert (registration form)
CREATE POLICY "Anyone can register a company"
  ON companies FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to view all companies (admin)
CREATE POLICY "Authenticated users can view all companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update companies (admin)
CREATE POLICY "Authenticated users can update companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete companies (admin)
CREATE POLICY "Authenticated users can delete companies"
  ON companies FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for samples table
-- Allow public to insert samples (registration form)
CREATE POLICY "Anyone can submit samples"
  ON samples FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to view all samples (admin)
CREATE POLICY "Authenticated users can view all samples"
  ON samples FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update samples (admin)
CREATE POLICY "Authenticated users can update samples"
  ON samples FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete samples (admin)
CREATE POLICY "Authenticated users can delete samples"
  ON samples FOR DELETE
  TO authenticated
  USING (true);