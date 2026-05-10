const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS engineers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    portfolio TEXT,
    capability TEXT,
    role_description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS engineer_skills (
    engineer_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    PRIMARY KEY (engineer_id, skill_id),
    FOREIGN KEY (engineer_id) REFERENCES engineers(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    start_date TEXT,
    end_date TEXT,
    total_effort_days INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS project_skills (
    project_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    effort_days INTEGER,
    PRIMARY KEY (project_id, skill_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    engineer_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    allocation_pct INTEGER NOT NULL DEFAULT 100,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (engineer_id) REFERENCES engineers(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );
`);

// Seed skills
const skillCount = db.prepare('SELECT COUNT(*) as c FROM skills').get();
if (skillCount.c === 0) {
  const skillNames = [
    'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js',
    'SQL', 'AWS', 'Docker', 'Kubernetes', 'Go', 'Spring Boot',
    'Terraform', 'C++', 'Rust'
  ];
  const insertSkill = db.prepare('INSERT INTO skills (name) VALUES (?)');
  for (const name of skillNames) {
    insertSkill.run(name);
  }
  console.log('Seeded skills.');
}

// Seed engineers, projects, assignments
const engineerCount = db.prepare('SELECT COUNT(*) as c FROM engineers').get();
if (engineerCount.c === 0) {
  const getSkillId = (name) => db.prepare('SELECT id FROM skills WHERE name = ?').get(name)?.id;

  // Insert engineers
  const insertEngineer = db.prepare(`
    INSERT INTO engineers (name, email, portfolio, capability, role_description)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertEngineerSkill = db.prepare('INSERT INTO engineer_skills (engineer_id, skill_id) VALUES (?, ?)');

  const engineers = [
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      portfolio: 'Payments',
      capability: 'Principal Engineer',
      role_description: 'Leads architectural decisions for the payments platform. Deep expertise in distributed systems, event-driven design, and financial compliance requirements.',
      skills: ['Java', 'Spring Boot', 'Kubernetes', 'AWS', 'SQL']
    },
    {
      name: 'Marcus Chen',
      email: 'marcus.chen@example.com',
      portfolio: 'Platform',
      capability: 'Lead Engineer',
      role_description: 'Owns the internal developer platform. Focuses on CI/CD tooling, infrastructure automation, and developer experience improvements.',
      skills: ['Go', 'Terraform', 'Kubernetes', 'Docker', 'AWS']
    },
    {
      name: 'Aisha Okonkwo',
      email: 'aisha.okonkwo@example.com',
      portfolio: 'Data',
      capability: 'Senior Engineer',
      role_description: 'Specialises in large-scale data pipelines and analytics infrastructure. Proficient in Python-based ML workflows and SQL query optimisation.',
      skills: ['Python', 'SQL', 'AWS', 'Docker', 'TypeScript']
    },
    {
      name: 'Tom Bellingham',
      email: 'tom.bellingham@example.com',
      portfolio: 'Payments',
      capability: 'Senior Engineer',
      role_description: 'Full-stack engineer with a strong focus on web performance and API design. Comfortable across the React/Node.js stack and backend service development.',
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL']
    },
    {
      name: 'Sofia Reyes',
      email: 'sofia.reyes@example.com',
      portfolio: 'Platform',
      capability: 'Lead Engineer',
      role_description: 'Infrastructure and security lead. Drives platform reliability initiatives and is the primary owner of the Kubernetes cluster strategy.',
      skills: ['Rust', 'C++', 'Kubernetes', 'Docker', 'Terraform', 'AWS']
    }
  ];

  const engineerIds = [];
  for (const eng of engineers) {
    const result = insertEngineer.run(eng.name, eng.email, eng.portfolio, eng.capability, eng.role_description);
    const engId = result.lastInsertRowid;
    engineerIds.push(engId);
    for (const skillName of eng.skills) {
      const skillId = getSkillId(skillName);
      if (skillId) insertEngineerSkill.run(engId, skillId);
    }
  }

  // Insert projects
  const insertProject = db.prepare(`
    INSERT INTO projects (name, description, start_date, end_date, total_effort_days)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertProjectSkill = db.prepare('INSERT INTO project_skills (project_id, skill_id, effort_days) VALUES (?, ?, ?)');
  const insertAssignment = db.prepare(`
    INSERT INTO assignments (engineer_id, project_id, start_date, end_date, allocation_pct)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Project 1: API Modernisation
  const p1 = insertProject.run(
    'API Modernisation',
    'Migrate legacy REST APIs to a modern event-driven microservices architecture using Go and Kubernetes. Includes deprecation of monolith endpoints and full API gateway rollout.',
    '2026-01-05',
    '2026-06-30',
    120
  );
  for (const [skillName, effort] of [['Go', 40], ['Kubernetes', 30], ['Terraform', 20], ['Docker', 15], ['SQL', 15]]) {
    const sid = getSkillId(skillName);
    if (sid) insertProjectSkill.run(p1.lastInsertRowid, sid, effort);
  }
  // Assignments for API Modernisation
  insertAssignment.run(engineerIds[1], p1.lastInsertRowid, '2026-01-05', '2026-06-30', 100); // Marcus
  insertAssignment.run(engineerIds[4], p1.lastInsertRowid, '2026-01-05', '2026-04-30', 75);  // Sofia
  insertAssignment.run(engineerIds[0], p1.lastInsertRowid, '2026-02-01', '2026-06-30', 50);  // Priya

  // Project 2: Data Platform Migration
  const p2 = insertProject.run(
    'Data Platform Migration',
    'Consolidate three separate data warehouses into a unified lakehouse on AWS. Deliver real-time ingestion pipelines, self-serve analytics, and a governed data catalogue.',
    '2026-03-01',
    '2026-10-31',
    180
  );
  for (const [skillName, effort] of [['Python', 60], ['SQL', 50], ['AWS', 40], ['Docker', 20], ['TypeScript', 10]]) {
    const sid = getSkillId(skillName);
    if (sid) insertProjectSkill.run(p2.lastInsertRowid, sid, effort);
  }
  // Assignments for Data Platform Migration
  insertAssignment.run(engineerIds[2], p2.lastInsertRowid, '2026-03-01', '2026-10-31', 100); // Aisha
  insertAssignment.run(engineerIds[0], p2.lastInsertRowid, '2026-04-01', '2026-10-31', 50);  // Priya

  // Project 3: Mobile App Rebuild
  const p3 = insertProject.run(
    'Mobile App Rebuild',
    'Full rebuild of the customer-facing mobile application using React Native and a new TypeScript API layer. Includes biometric auth, offline support, and a redesigned payments flow.',
    '2026-05-01',
    '2026-12-31',
    160
  );
  for (const [skillName, effort] of [['React', 60], ['TypeScript', 50], ['Node.js', 30], ['SQL', 20]]) {
    const sid = getSkillId(skillName);
    if (sid) insertProjectSkill.run(p3.lastInsertRowid, sid, effort);
  }
  // Assignments for Mobile App Rebuild
  insertAssignment.run(engineerIds[3], p3.lastInsertRowid, '2026-05-01', '2026-12-31', 100); // Tom
  insertAssignment.run(engineerIds[2], p3.lastInsertRowid, '2026-07-01', '2026-12-31', 75);  // Aisha
  insertAssignment.run(engineerIds[4], p3.lastInsertRowid, '2026-05-01', '2026-12-31', 50);  // Sofia

  console.log('Seeded engineers, projects, and assignments.');
}

module.exports = db;
