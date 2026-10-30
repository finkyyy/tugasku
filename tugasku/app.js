const SUPABASE_URL = 'https://stwskjlvvpptxiavuzhd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0d3Nramx2dnBwdHhpYXZ1emhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNjM1NDAsImV4cCI6MjEwODczOTU0MH0.Od4QotU4cs3odNKyiBbpW1ptrMsv4-bSZizJfqXAMYI';
const TABLE = 'tugas_kuliah';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let tasks = [];
let currentFilter = 'all';

const form = document.getElementById('task-form');
const namaInput = document.getElementById('nama-tugas');
const deadlineInput = document.getElementById('deadline');
const submitBtn = document.getElementById('submit-btn');
const listEl = document.getElementById('task-list');
const statusEl = document.getElementById('status');
const filterBtns = document.querySelectorAll('.filter-btn');

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showStatus(msg, isError = false) {
  if (!msg) {
    statusEl.classList.add('hidden');
    statusEl.innerHTML = '';
    statusEl.classList.remove('text-red-600');
    statusEl.classList.remove('text-plum-600');
    return;
  }
  if (msg === 'Memuat tugas...') {
    statusEl.innerHTML = `<span class="inline-flex items-center gap-2"><svg class="w-4 h-4 animate-pulse" aria-hidden="true" viewBox="0 0 64 64"><g fill="#F472B6"><path d="M32 32 C20 10, 4 14, 12 32 C4 50, 20 54, 32 32Z"/><path d="M32 32 C44 10, 60 14, 52 32 C60 50, 44 54, 32 32Z"/></g><circle cx="32" cy="32" r="2" fill="#5B2A4A"/></svg> Memuat tugas... 🦋</span>`;
  } else {
    statusEl.textContent = msg;
  }
  statusEl.classList.remove('hidden');
  if (isError) {
    statusEl.classList.add('text-red-600');
    statusEl.classList.remove('text-plum-600');
  } else {
    statusEl.classList.add('text-plum-600');
    statusEl.classList.remove('text-red-600');
  }
}

function formatDeadline(iso) {
  return new Date(iso).toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isUrgent(task) {
  if (task.is_completed) return false;
  const diff = new Date(task.deadline).getTime() - Date.now();
  return diff < 24 * 60 * 60 * 1000; // < 24 jam atau sudah lewat
}

function deadlineNote(task) {
  if (task.is_completed) return '';
  const diff = new Date(task.deadline).getTime() - Date.now();
  if (diff < 0) return 'Deadline terlewat!';
  if (diff < 24 * 60 * 60 * 1000) {
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `Sisa ${h} jam ${m} menit`;
  }
  return '';
}

function heartFull(sizeClass = 'w-8 h-8') {
  return `<svg class="heart-icon heart-full shrink-0 ${sizeClass}" role="img" aria-label="Sudah dikerjakan" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 28 C16 28 5 21.3 5 13.8 C5 9.2 8.1 6 11.8 6 C13.8 6 15.4 7 16 8.4 C16.6 7 18.2 6 20.2 6 C23.9 6 27 9.2 27 13.8 C27 21.3 16 28 16 28 Z" fill="#E11D48"/>
    <ellipse cx="11.4" cy="11.1" rx="2.3" ry="1.5" fill="#FFFFFF" opacity="0.9" transform="rotate(-35 11.4 11.1)"/>
  </svg>`;
}

function heartBroken(urgent = false, sizeClass = 'w-8 h-8') {
  const fill = urgent ? '#FFFFFF' : '#F9A8D4';
  const crack = urgent ? '#991B1B' : '#BE185D';
  return `<svg class="heart-icon heart-broken shrink-0 ${sizeClass}" role="img" aria-label="Belum dikerjakan" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <g fill="${fill}">
      <path transform="translate(-0.9 0)" d="M15.5 8.4 C14.9 7 13.4 6 11.5 6 C7.9 6 4.8 9.2 4.8 13.8 C4.8 20.8 13.9 27.3 15.5 28.1 L16.4 25.5 L14.8 22.5 L16.6 19 L14.6 15.5 L16.8 12 Z"/>
      <path transform="translate(0.9 0)" d="M15.5 8.4 L16.8 12 L14.6 15.5 L16.6 19 L14.8 22.5 L16.4 25.5 L15.5 28.1 C17.1 27.3 26.2 20.8 26.2 13.8 C26.2 9.2 23.1 6 19.5 6 C17.6 6 16.1 7 15.5 8.4 Z"/>
    </g>
    <path d="M15.5 8.4 L16.8 12 L14.6 15.5 L16.6 19 L14.8 22.5 L16.4 25.5 L15.5 28.1" fill="none" stroke="${crack}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function updateFilterButtons() {
  filterBtns.forEach((btn) => {
    const active = btn.dataset.filter === currentFilter;
    btn.className =
      'filter-btn flex-1 rounded-full px-3 py-2 text-sm font-semibold border transition-all ' +
      (active
        ? 'bg-gradient-to-r from-blush-400 to-rose-400 text-white border-transparent shadow-[0_8px_30px_-12px_rgba(244,114,182,0.9)]'
        : 'bg-white/90 text-plum-700 border-pink-200 hover:bg-pink-50');
  });
}

function render() {
  updateFilterButtons();

  const filtered = tasks.filter((t) => {
    if (currentFilter === 'done') return t.is_completed;
    if (currentFilter === 'undone') return !t.is_completed;
    return true;
  });

  listEl.innerHTML = '';

  if (filtered.length === 0) {
    if (currentFilter === 'done') {
      statusEl.innerHTML = `<span class="inline-flex items-center gap-2">${heartBroken(false, 'w-5 h-5')} Belum ada yang selesai, yuk semangat! 💔</span>`;
      statusEl.classList.remove('hidden');
      statusEl.classList.add('text-plum-600');
      statusEl.classList.remove('text-red-600');
    } else if (currentFilter === 'undone') {
      statusEl.innerHTML = `<span class="inline-flex items-center gap-2">${heartFull('w-5 h-5')} Semua tugas beres, hatimu penuh! ❤️</span>`;
      statusEl.classList.remove('hidden');
      statusEl.classList.add('text-plum-600');
      statusEl.classList.remove('text-red-600');
    } else {
      statusEl.innerHTML = `<span class="inline-flex items-center gap-2"><svg class="w-4 h-4" aria-hidden="true" viewBox="0 0 64 64"><g fill="#C4B5FD"><path d="M32 32 C20 10, 4 14, 12 32 C4 50, 20 54, 32 32Z"/><path d="M32 32 C44 10, 60 14, 52 32 C60 50, 44 54, 32 32Z"/></g><circle cx="32" cy="32" r="2" fill="#5B2A4A"/></svg> Belum ada tugas, yeay santai dulu 🦋</span>`;
      statusEl.classList.remove('hidden');
      statusEl.classList.add('text-plum-600');
      statusEl.classList.remove('text-red-600');
    }
    return;
  }
  showStatus('');

  filtered.forEach((task) => {
    const urgent = isUrgent(task);
    const containerClass = urgent
      ? 'bg-red-100 border-red-500 text-red-900 urgent-pulse'
      : task.is_completed
        ? 'bg-mint-100/70 border-pink-200 text-plum-700'
        : 'bg-white/90 border-pink-200 text-plum-700';
    const note = deadlineNote(task);

    const li = document.createElement('li');
    li.className = `border-l-4 rounded-3xl shadow-[0_10px_40px_-12px_rgba(244,114,182,0.4)] p-4 card-anim ${containerClass}`;
    li.innerHTML = `
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            ${task.is_completed ? heartFull() : heartBroken(urgent)}
            <h3 class="min-w-0 flex-1 font-semibold break-words ${task.is_completed ? 'line-through opacity-70' : ''}">
              ${escapeHTML(task.nama_tugas)}
            </h3>
          </div>
          <p class="text-sm opacity-80 mt-1 flex items-center gap-1">📅 ${escapeHTML(formatDeadline(task.deadline))}</p>
          ${note ? `<p class="text-sm font-semibold mt-1 flex items-center gap-1 ${urgent ? 'text-red-700' : ''}">${urgent ? '⏰ ' : ''}${escapeHTML(note)}${urgent && note.includes('lewat') ? ' 🔔' : urgent ? ' 💕' : ''}</p>` : ''}
        </div>
        <div class="flex gap-2 shrink-0 flex-wrap">
          <button type="button" data-action="toggle" data-id="${escapeHTML(task.id)}" aria-label="${task.is_completed ? 'Batal Selesai' : 'Tandai Selesai'}"
            class="min-h-[44px] rounded-full px-4 py-1.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
              task.is_completed ? 'bg-gradient-to-r from-lavender-400 to-blush-400 hover:from-blush-400 hover:to-rose-400 focus:ring-blush-400' : 'bg-gradient-to-r from-mint-100 to-[#A7F3D0] text-plum-700 hover:brightness-95 focus:ring-mint-100'
            }">
            ${task.is_completed ? 'Batal Selesai' : 'Tandai Selesai'}
          </button>
          <button type="button" data-action="delete" data-id="${escapeHTML(task.id)}" aria-label="Hapus tugas"
            class="min-h-[44px] rounded-full px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-rose-400 to-blush-400 hover:from-rose-400 hover:to-blush-500 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2">
            Hapus
          </button>
        </div>
      </div>
    `;
    listEl.appendChild(li);
  });
}

async function fetchTasks() {
  showStatus('Memuat tugas...');
  try {
    const { data, error } = await db
      .from(TABLE)
      .select('*')
      .order('deadline', { ascending: true });

    if (error) {
      console.error(error);
      showStatus('Gagal memuat data: ' + error.message, true);
      listEl.innerHTML = '';
      return;
    }
    tasks = data || [];
    render();
  } catch (e) {
    console.error(e);
    showStatus('Gagal memuat data. Periksa koneksi atau konfigurasi Supabase.', true);
    listEl.innerHTML = '';
  }
}

async function addTask(nama, deadlineLocal) {
  try {
    const { error } = await db.from(TABLE).insert([
      {
        nama_tugas: nama,
        deadline: new Date(deadlineLocal).toISOString(),
        is_completed: false,
      },
    ]);
    if (error) {
      console.error(error);
      showStatus('Gagal menambah tugas: ' + error.message, true);
      return false;
    }
    await fetchTasks();
    return true;
  } catch (e) {
    console.error(e);
    showStatus('Gagal menambah tugas. Periksa konfigurasi Supabase.', true);
    return false;
  }
}

async function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  try {
    const { error } = await db
      .from(TABLE)
      .update({ is_completed: !task.is_completed })
      .eq('id', id);
    if (error) {
      console.error(error);
      showStatus('Gagal mengubah status: ' + error.message, true);
      return;
    }
    task.is_completed = !task.is_completed;
    render();
  } catch (e) {
    console.error(e);
    showStatus('Gagal mengubah status. Periksa konfigurasi Supabase.', true);
  }
}

async function deleteTask(id) {
  if (!confirm('Hapus tugas ini?')) return;
  try {
    const { error } = await db.from(TABLE).delete().eq('id', id);
    if (error) {
      console.error(error);
      showStatus('Gagal menghapus tugas: ' + error.message, true);
      return;
    }
    tasks = tasks.filter((t) => t.id !== id);
    render();
  } catch (e) {
    console.error(e);
    showStatus('Gagal menghapus tugas. Periksa konfigurasi Supabase.', true);
  }
}

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nama = namaInput.value.trim();
    const deadline = deadlineInput.value;
    if (!nama || !deadline) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan... 💕';
    const ok = await addTask(nama, deadline);
    submitBtn.disabled = false;
    submitBtn.textContent = '🌷 Tambah Tugas';
    if (ok) form.reset();
  });

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    render();
  });
});

listEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'toggle') toggleTask(id);
  if (action === 'delete') deleteTask(id);
});

document.addEventListener('DOMContentLoaded', () => {
  fetchTasks();
  // Segarkan tampilan tiap menit agar peringatan deadline tetap akurat
  setInterval(render, 60 * 1000);
});
