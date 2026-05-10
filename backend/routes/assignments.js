const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/assignments
router.get('/', (req, res) => {
  const { engineer_id, project_id, year } = req.query;
  const conditions = [];
  const params = [];

  if (engineer_id) { conditions.push('a.engineer_id = ?'); params.push(engineer_id); }
  if (project_id) { conditions.push('a.project_id = ?'); params.push(project_id); }
  if (year) {
    conditions.push(`(strftime('%Y', a.start_date) = ? OR strftime('%Y', a.end_date) = ? OR (strftime('%Y', a.start_date) < ? AND strftime('%Y', a.end_date) > ?))`);
    params.push(year, year, year, year);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const assignments = db.prepare(`
    SELECT a.*, e.name as engineer_name, p.name as project_name
    FROM assignments a
    JOIN engineers e ON e.id = a.engineer_id
    JOIN projects p ON p.id = a.project_id
    ${where}
    ORDER BY a.start_date
  `).all(...params);

  res.json(assignments);
});

// POST /api/assignments
router.post('/', (req, res) => {
  const { engineer_id, project_id, start_date, end_date, allocation_pct } = req.body;
  if (!engineer_id || !project_id || !start_date || !end_date) {
    return res.status(400).json({ error: 'engineer_id, project_id, start_date, end_date are required' });
  }
  if (allocation_pct < 1 || allocation_pct > 100) {
    return res.status(400).json({ error: 'allocation_pct must be between 1 and 100' });
  }

  const result = db.prepare(`
    INSERT INTO assignments (engineer_id, project_id, start_date, end_date, allocation_pct)
    VALUES (?, ?, ?, ?, ?)
  `).run(engineer_id, project_id, start_date, end_date, allocation_pct || 100);

  const assignment = db.prepare(`
    SELECT a.*, e.name as engineer_name, p.name as project_name
    FROM assignments a
    JOIN engineers e ON e.id = a.engineer_id
    JOIN projects p ON p.id = a.project_id
    WHERE a.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(assignment);
});

// PUT /api/assignments/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { start_date, end_date, allocation_pct } = req.body;

  db.prepare(`
    UPDATE assignments SET
      start_date = COALESCE(?, start_date),
      end_date = COALESCE(?, end_date),
      allocation_pct = COALESCE(?, allocation_pct)
    WHERE id = ?
  `).run(start_date || null, end_date || null, allocation_pct || null, id);

  const assignment = db.prepare(`
    SELECT a.*, e.name as engineer_name, p.name as project_name
    FROM assignments a
    JOIN engineers e ON e.id = a.engineer_id
    JOIN projects p ON p.id = a.project_id
    WHERE a.id = ?
  `).get(id);

  res.json(assignment);
});

// DELETE /api/assignments/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM assignments WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;
