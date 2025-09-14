-- Create radar_charts table for storing radar chart data
create table radar_charts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  tenant_id uuid,
  data jsonb not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table radar_charts enable row level security;

-- Create policies for radar_charts table
create policy "Users can view their own radar charts." on radar_charts
  for select using (auth.uid() = user_id);

create policy "Users can insert their own radar charts." on radar_charts
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own radar charts." on radar_charts
  for update using (auth.uid() = user_id);

create policy "Users can delete their own radar charts." on radar_charts
  for delete using (auth.uid() = user_id);

-- Create indexes for better performance
create index radar_charts_user_id_idx on radar_charts (user_id);
create index radar_charts_tenant_id_idx on radar_charts (tenant_id);
create index radar_charts_created_at_idx on radar_charts (created_at desc);

-- Function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at timestamp on radar_charts
create trigger update_radar_charts_updated_at
  before update on radar_charts
  for each row execute function update_updated_at_column();
