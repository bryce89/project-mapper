const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/skills
router.get('/', (req, res) => {
  const skills = db.prepare('SELECT * FROM skills ORDER BY name').all();
  res.json(skills);
});

// POST /api/skills
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  try {
    const result = db.prepare('INSERT INTO skills (name) VALUES (?)').run(name.trim());
    const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(skill);
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Skill already exists' });
    throw e;
  }
});

// PUT /api/skills/:id
router.put('/:id', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(req.params.id);
  if (!skill) return res.status(404).json({ error: 'Not found' });
  try {
    db.prepare('UPDATE skills SET name = ? WHERE id = ?').run(name.trim(), req.params.id);
    res.json(db.prepare('SELECT * FROM skills WHERE id = ?').get(req.params.id));
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Skill already exists' });
    throw e;
  }
});

// DELETE /api/skills/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(id);
  if (!skill) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM skills WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;
