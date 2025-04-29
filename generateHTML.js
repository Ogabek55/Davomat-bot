module.exports = function generateHTML(data) {
    const rows = data.map(record => `
      <tr>
        <td>${record.id}</td>
        <td>${record.name}</td>
        <td>${record.date}</td>
        <td>${record.time}</td>
        <td>${record.status}</td>
      </tr>
    `).join('');
  
    return `
      <!DOCTYPE html>
      <html lang="uz">
      <head>
        <meta charset="UTF-8">
        <title>Davomat</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #999; padding: 8px; text-align: center; }
          th { background-color: #eee; }
          .filter-buttons {
            margin-bottom: 10px;
          }
          button {
            margin-right: 5px;
            padding: 5px 10px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <h2>Bugungi Davomat</h2>
        <div class="filter-buttons">
          <button onclick="filterTable('all')">Hammasi</button>
          <button onclick="filterTable('✅ Ishdaman')">Kelganlar</button>
          <button onclick="filterTable('❌ Ishda emasman')">Kelmaganlar</button>
        </div>
        <table id="attendance-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ism</th>
              <th>Sana</th>
              <th>Vaqt</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
  
        <script>
          function filterTable(status) {
            const rows = document.querySelectorAll('#attendance-table tbody tr');
            rows.forEach(row => {
              const cell = row.cells[4].textContent;
              row.style.display = (status === 'all' || cell === status) ? '' : 'none';
            });
          }
        </script>
      </body>
      </html>
    `;
  };
  