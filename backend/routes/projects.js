const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/projects
router.get('/', (req, res) => {
  const { skill, search } = req.query;

  let query = `SELECT DISTINCT p.* FROM projects p`;
  const params = [];
  const conditions = [];

  if (skill) {
    query += ` JOIN project_skills ps ON ps.project_id = p.id JOIN skills sk ON sk.id = ps.skill_id`;
    conditions.push(`sk.name = ?`);
    params.push(skill);
  }

  if (search) {
    conditions.push(`(p.name LIKE ? OR p.description LIKE ?)`);
    const like = `%${search}%`;
    params.push(like, like);
  }

  if (conditions.length) query += ` WHERE ` + conditions.join(' AND ');
  query += ` ORDER BY p.start_date, p.name`;

  const projects = db.prepare(query).all(...params);

  // Attach skills and engineer_count
  const result = projects.map(project => {
    const skills = db.prepare(`
      SELECT s.id, s.name, ps.effort_days
      FROM project_skills ps
      JOIN skills s ON s.id = ps.skill_id
      WHERE ps.project_id = ?
      ORDER BY s.name
    `).all(project.id);

    const { count } = db.prepare(`
      SELECT COUNT(DISTINCT engineer_id) as count FROM assignments WHERE project_id = ?
    `).get(project.id);

    return { ...project, skills, engineer_count: count };
  });

  res.json(result);
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });

  const skills = db.prepare(`
    SELECT s.id, s.name, ps.effort_days
    FROM project_skills ps
    JOIN skills s ON s.id = ps.skill_id
    WHERE ps.project_id = ?
    ORDER BY s.name
  `).all(req.params.id);

  const assignments = db.prepare(`
    SELECT a.*, e.name as engineer_name, e.portfolio, e.capability
    FROM assignments a
    JOIN engineers e ON e.id = a.engineer_id
    WHERE a.project_id = ?
    ORDER BY e.name
  `).all(req.params.id);

  res.json({ ...project, skills, assignments });
});

// POST /api/projects
router.post('/', (req, res) => {
  const { name, description, start_date, end_date, total_effort_days, skill_ids = [] } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });

  const result = db.prepare(`
    INSERT INTO projects (name, description, start_date, end_date, total_effort_days)
    VALUES (?, ?, ?, ?, ?)
  `).run(name.trim(), description || null, start_date || null, end_date || null, total_effort_days || null);

  const id = result.lastInsertRowid;
  const insertSkill = db.prepare('INSERT OR IGNORE INTO project_skills (project_id, skill_id, effort_days) VALUES (?, ?, ?)');
  for (const s of skill_ids) {
    insertSkill.run(id, s.id, s.effort_days || null);
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  const skills = db.prepare(`
    SELECT s.id, s.name, ps.effort_days FROM project_skills ps
    JOIN skills s ON s.id = ps.skill_id WHERE ps.project_id = ? ORDER BY s.name
  `).all(id);
  res.status(201).json({ ...project, skills, assignments: [] });
});

// PUT /api/projects/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { name, description, start_date, end_date, total_effort_days, skill_ids } = req.body;
  if (name !== undefined && !name.trim()) return res.status(400).json({ error: 'name cannot be empty' });

  db.prepare(`
    UPDATE projects SET
      name = COALESCE(?, name),
      description = ?,
      start_date = ?,
      end_date = ?,
      total_effort_days = ?
    WHERE id = ?
  `).run(
    name ? name.trim() : null,
    description !== undefined ? (description || null) : existing.description,
    start_date !== undefined ? (start_date || null) : existing.start_date,
    end_date !== undefined ? (end_date || null) : existing.end_date,
    total_effort_days !== undefined ? (total_effort_days || null) : existing.total_effort_days,
    id
  );

  if (skill_ids !== undefined) {
    db.prepare('DELETE FROM project_skills WHERE project_id = ?').run(id);
    const insertSkill = db.prepare('INSERT OR IGNORE INTO project_skills (project_id, skill_id, effort_days) VALUES (?, ?, ?)');
    for (const s of skill_ids) {
      insertSkill.run(id, s.id, s.effort_days || null);
    }
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  const skills = db.prepare(`
    SELECT s.id, s.name, ps.effort_days FROM project_skills ps
    JOIN skills s ON s.id = ps.skill_id WHERE ps.project_id = ? ORDER BY s.name
  `).all(id);
  const assignments = db.prepare(`
    SELECT a.*, e.name as engineer_name, e.portfolio, e.capability
    FROM assignments a JOIN engineers e ON e.id = a.engineer_id
    WHERE a.project_id = ? ORDER BY e.name
  `).all(id);
  res.json({ ...project, skills, assignments });
});

// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;
