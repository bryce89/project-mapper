const express = require('express');
const db = require('../db');
const router = express.Router();

function attachSkills(engineers) {
  if (!engineers.length) return engineers;
  const ids = engineers.map(e => e.id);
  const placeholders = ids.map(() => '?').join(',');
  const skills = db.prepare(`
    SELECT es.engineer_id, s.id, s.name
    FROM engineer_skills es
    JOIN skills s ON s.id = es.skill_id
    WHERE es.engineer_id IN (${placeholders})
    ORDER BY s.name
  `).all(...ids);

  const skillMap = {};
  for (const s of skills) {
    if (!skillMap[s.engineer_id]) skillMap[s.engineer_id] = [];
    skillMap[s.engineer_id].push({ id: s.id, name: s.name });
  }
  return engineers.map(e => ({ ...e, skills: skillMap[e.id] || [] }));
}

function attachAllocationSummary(engineers) {
  return engineers.map(e => {
    const assignments = db.prepare(`
      SELECT a.project_id, a.allocation_pct, p.name as project_name
      FROM assignments a
      JOIN projects p ON p.id = a.project_id
      WHERE a.engineer_id = ?
    `).all(e.id);

    const projectCount = assignments.length;
    const totalAllocation = assignments.reduce((sum, a) => sum + a.allocation_pct, 0);
    return { ...e, project_count: projectCount, total_allocation_pct: totalAllocation };
  });
}

// GET /api/engineers
router.get('/', (req, res) => {
  const { skill, portfolio, capability, search } = req.query;

  let query = `SELECT DISTINCT e.* FROM engineers e`;
  const params = [];
  const conditions = [];

  if (skill) {
    query += ` JOIN engineer_skills es ON es.engineer_id = e.id JOIN skills sk ON sk.id = es.skill_id`;
    conditions.push(`sk.name = ?`);
    params.push(skill);
  }

  if (portfolio) {
    conditions.push(`e.portfolio = ?`);
    params.push(portfolio);
  }
  if (capability) {
    conditions.push(`e.capability = ?`);
    params.push(capability);
  }
  if (search) {
    conditions.push(`(e.name LIKE ? OR e.email LIKE ? OR e.portfolio LIKE ?)`);
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  if (conditions.length) query += ` WHERE ` + conditions.join(' AND ');
  query += ` ORDER BY e.name`;

  let engineers = db.prepare(query).all(...params);
  engineers = attachSkills(engineers);
  engineers = attachAllocationSummary(engineers);
  res.json(engineers);
});

// GET /api/engineers/:id
router.get('/:id', (req, res) => {
  const engineer = db.prepare('SELECT * FROM engineers WHERE id = ?').get(req.params.id);
  if (!engineer) return res.status(404).json({ error: 'Not found' });

  const skills = db.prepare(`
    SELECT s.id, s.name FROM engineer_skills es
    JOIN skills s ON s.id = es.skill_id
    WHERE es.engineer_id = ?
    ORDER BY s.name
  `).all(req.params.id);

  res.json({ ...engineer, skills });
});

// POST /api/engineers
router.post('/', (req, res) => {
  const { name, email, portfolio, capability, role_description, skill_ids = [] } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });

  const result = db.prepare(`
    INSERT INTO engineers (name, email, portfolio, capability, role_description)
    VALUES (?, ?, ?, ?, ?)
  `).run(name.trim(), email || null, portfolio || null, capability || null, role_description || null);

  const id = result.lastInsertRowid;
  const insertSkill = db.prepare('INSERT OR IGNORE INTO engineer_skills (engineer_id, skill_id) VALUES (?, ?)');
  for (const sid of skill_ids) insertSkill.run(id, sid);

  const engineer = db.prepare('SELECT * FROM engineers WHERE id = ?').get(id);
  const skills = db.prepare(`
    SELECT s.id, s.name FROM engineer_skills es
    JOIN skills s ON s.id = es.skill_id WHERE es.engineer_id = ? ORDER BY s.name
  `).all(id);
  res.status(201).json({ ...engineer, skills });
});

// PUT /api/engineers/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM engineers WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { name, email, portfolio, capability, role_description, skill_ids } = req.body;
  if (name !== undefined && !name.trim()) return res.status(400).json({ error: 'name cannot be empty' });

  db.prepare(`
    UPDATE engineers SET
      name = COALESCE(?, name),
      email = ?,
      portfolio = ?,
      capability = ?,
      role_description = ?
    WHERE id = ?
  `).run(
    name ? name.trim() : null,
    email !== undefined ? (email || null) : existing.email,
    portfolio !== undefined ? (portfolio || null) : existing.portfolio,
    capability !== undefined ? (capability || null) : existing.capability,
    role_description !== undefined ? (role_description || null) : existing.role_description,
    id
  );

  if (skill_ids !== undefined) {
    db.prepare('DELETE FROM engineer_skills WHERE engineer_id = ?').run(id);
    const insertSkill = db.prepare('INSERT OR IGNORE INTO engineer_skills (engineer_id, skill_id) VALUES (?, ?)');
    for (const sid of skill_ids) insertSkill.run(id, sid);
  }

  const engineer = db.prepare('SELECT * FROM engineers WHERE id = ?').get(id);
  const skills = db.prepare(`
    SELECT s.id, s.name FROM engineer_skills es
    JOIN skills s ON s.id = es.skill_id WHERE es.engineer_id = ? ORDER BY s.name
  `).all(id);
  res.json({ ...engineer, skills });
});

// DELETE /api/engineers/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM engineers WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM engineers WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;
