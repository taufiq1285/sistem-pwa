const url = "https://rkyoifqbfcztnhevpnpx.supabase.co/rest/v1/jadwal_praktikum?select=*,kelas:kelas_id(nama_kelas,kode_kelas,mata_kuliah:mata_kuliah_id(nama_mk,kode_mk))&limit=5";

fetch(url, {
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJreW9pZnFiZmN6dG5oZXZwbnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NDQyNDMsImV4cCI6MjA3NjMyMDI0M30.-P894i9DGQdkSl-_4gu9rJL9vu0SPnRMDy4yK5grw-E",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJreW9pZnFiZmN6dG5oZXZwbnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NDQyNDMsImV4cCI6MjA3NjMyMDI0M30.-P894i9DGQdkSl-_4gu9rJL9vu0SPnRMDy4yK5grw-E"
  }
}).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2))).catch(err => console.error(err));
