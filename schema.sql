create table if not exists books (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  author text not null,
  publish_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS) to allow public access for this quick test
alter table books enable row level security;

-- Drop the policy if it exists to avoid errors on re-run, then create it
drop policy if exists "Allow public access to books" on books;
create policy "Allow public access to books" on books for all using (true);
