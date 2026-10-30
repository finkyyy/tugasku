-- Skema untuk aplikasi TugasKu
-- Aman dijalankan ulang (idempotent)

create table if not exists public.tugas_kuliah (
  id uuid primary key default gen_random_uuid(),
  nama_tugas text not null,
  deadline timestamptz not null,
  is_completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.tugas_kuliah enable row level security;

-- Hapus policy lama jika ada agar bisa dijalankan ulang dengan aman
drop policy if exists "public select" on public.tugas_kuliah;
drop policy if exists "public insert" on public.tugas_kuliah;
drop policy if exists "public update" on public.tugas_kuliah;
drop policy if exists "public delete" on public.tugas_kuliah;

-- Akses publik penuh (hanya untuk demo/tanpa login). Sesuaikan jika memakai autentikasi.
create policy "public select" on public.tugas_kuliah for select using (true);
create policy "public insert" on public.tugas_kuliah for insert with check (true);
create policy "public update" on public.tugas_kuliah for update using (true);
create policy "public delete" on public.tugas_kuliah for delete using (true);
