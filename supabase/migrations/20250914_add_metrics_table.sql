-- Create metrics table for multi-tenant analytics with proper RLS
CREATE TABLE metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_name VARCHAR(255) NOT NULL,
  metric_value DECIMAL(15,2) NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_metrics_tenant_id ON metrics(tenant_id);
CREATE INDEX idx_metrics_date ON metrics(metric_date);
CREATE INDEX idx_metrics_name ON metrics(metric_name);
CREATE INDEX idx_metrics_tenant_date ON metrics(tenant_id, metric_date);

-- Enable Row Level Security
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for metrics - users can only access their own data
CREATE POLICY "Users can only access their own metrics" ON metrics
  FOR ALL USING (auth.uid() = tenant_id);

-- Create policy for authenticated users to insert their own metrics
CREATE POLICY "Users can insert their own metrics" ON metrics
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

-- Create policy for authenticated users to update their own metrics
CREATE POLICY "Users can update their own metrics" ON metrics
  FOR UPDATE USING (auth.uid() = tenant_id);

-- Create policy for authenticated users to delete their own metrics
CREATE POLICY "Users can delete their own metrics" ON metrics
  FOR DELETE USING (auth.uid() = tenant_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_metrics_updated_at
  BEFORE UPDATE ON metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for demonstration
INSERT INTO metrics (tenant_id, metric_name, metric_value, metric_date, category) VALUES
  ((SELECT id FROM auth.users LIMIT 1), 'Revenue', 25000.00, '2024-01-01', 'Financial'),
  ((SELECT id FROM auth.users LIMIT 1), 'Revenue', 28000.00, '2024-01-02', 'Financial'),
  ((SELECT id FROM auth.users LIMIT 1), 'Revenue', 30000.00, '2024-01-03', 'Financial'),
  ((SELECT id FROM auth.users LIMIT 1), 'Users', 1250.00, '2024-01-01', 'Growth'),
  ((SELECT id FROM auth.users LIMIT 1), 'Users', 1340.00, '2024-01-02', 'Growth'),
  ((SELECT id FROM auth.users LIMIT 1), 'Users', 1420.00, '2024-01-03', 'Growth');
