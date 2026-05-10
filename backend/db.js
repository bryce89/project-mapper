const { Pool } = require('pg');

const pool = (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test')
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      host: 'localhost',
      port: 5432,
      database: process.env.PGDATABASE || 'project_mapper'
    });

async function initDB() {
  // Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS skills (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS engineers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      portfolio TEXT,
      role TEXT,
      role_description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS engineer_skills (
      engineer_id INTEGER NOT NULL REFERENCES engineers(id) ON DELETE CASCADE,
      skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      PRIMARY KEY (engineer_id, skill_id)
    );

    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      start_date TEXT,
      end_date TEXT,
      total_effort_days INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS project_skills (
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      effort_days INTEGER,
      PRIMARY KEY (project_id, skill_id)
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id SERIAL PRIMARY KEY,
      engineer_id INTEGER NOT NULL REFERENCES engineers(id) ON DELETE CASCADE,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      allocation_pct INTEGER NOT NULL DEFAULT 100,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await seedIfEmpty();
}

async function seedIfEmpty() {
  // Seed skills if empty
  const { rows: skillRows } = await pool.query('SELECT COUNT(*) AS c FROM skills');
  if (parseInt(skillRows[0].c, 10) === 0) {
    const skillNames = [
      'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js',
      'SQL', 'AWS', 'Docker', 'Kubernetes', 'Go', 'Spring Boot',
      'Terraform', 'C++', 'Rust'
    ];
    for (const name of skillNames) {
      await pool.query('INSERT INTO skills (name) VALUES ($1)', [name]);
    }
    console.log('Seeded skills.');
  }

  // Seed engineers, projects, assignments if engineers table is empty
  const { rows: engRows } = await pool.query('SELECT COUNT(*) AS c FROM engineers');
  if (parseInt(engRows[0].c, 10) === 0) {
    const getSkillId = async (name) => {
      const { rows } = await pool.query('SELECT id FROM skills WHERE name = $1', [name]);
      return rows[0]?.id;
    };

    const engineers = [
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        portfolio: 'Payments',
        role: 'Principal Engineer',
        role_description: 'Leads architectural decisions for the payments platform. Deep expertise in distributed systems, event-driven design, and financial compliance requirements.',
        skills: ['Java', 'Spring Boot', 'Kubernetes', 'AWS', 'SQL']
      },
      {
        name: 'Marcus Chen',
        email: 'marcus.chen@example.com',
        portfolio: 'Platform',
        role: 'Lead Engineer',
        role_description: 'Owns the internal developer platform. Focuses on CI/CD tooling, infrastructure automation, and developer experience improvements.',
        skills: ['Go', 'Terraform', 'Kubernetes', 'Docker', 'AWS']
      },
      {
        name: 'Aisha Okonkwo',
        email: 'aisha.okonkwo@example.com',
        portfolio: 'Data',
        role: 'Senior Engineer',
        role_description: 'Specialises in large-scale data pipelines and analytics infrastructure. Proficient in Python-based ML workflows and SQL query optimisation.',
        skills: ['Python', 'SQL', 'AWS', 'Docker', 'TypeScript']
      },
      {
        name: 'Tom Bellingham',
        email: 'tom.bellingham@example.com',
        portfolio: 'Payments',
        role: 'Senior Engineer',
        role_description: 'Full-stack engineer with a strong focus on web performance and API design. Comfortable across the React/Node.js stack and backend service development.',
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL']
      },
      {
        name: 'Sofia Reyes',
        email: 'sofia.reyes@example.com',
        portfolio: 'Platform',
        role: 'Lead Engineer',
        role_description: 'Infrastructure and security lead. Drives platform reliability initiatives and is the primary owner of the Kubernetes cluster strategy.',
        skills: ['Rust', 'C++', 'Kubernetes', 'Docker', 'Terraform', 'AWS']
      }
    ];

    const engineerIds = [];
    for (const eng of engineers) {
      const { rows } = await pool.query(
        'INSERT INTO engineers (name, email, portfolio, role, role_description) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [eng.name, eng.email, eng.portfolio, eng.role, eng.role_description]
      );
      const engId = rows[0].id;
      engineerIds.push(engId);
      for (const skillName of eng.skills) {
        const skillId = await getSkillId(skillName);
        if (skillId) {
          await pool.query(
            'INSERT INTO engineer_skills (engineer_id, skill_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [engId, skillId]
          );
        }
      }
    }

    // Project 1: API Modernisation
    const { rows: p1Rows } = await pool.query(
      'INSERT INTO projects (name, description, start_date, end_date, total_effort_days) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [
        'API Modernisation',
        'Migrate legacy REST APIs to a modern event-driven microservices architecture using Go and Kubernetes. Includes deprecation of monolith endpoints and full API gateway rollout.',
        '2026-01-05', '2026-06-30', 120
      ]
    );
    const p1Id = p1Rows[0].id;
    for (const [skillName, effort] of [['Go', 40], ['Kubernetes', 30], ['Terraform', 20], ['Docker', 15], ['SQL', 15]]) {
      const sid = await getSkillId(skillName);
      if (sid) await pool.query('INSERT INTO project_skills (project_id, skill_id, effort_days) VALUES ($1,$2,$3)', [p1Id, sid, effort]);
    }
    await pool.query('INSERT INTO assignments (engineer_id, project_id, start_date, end_date, allocation_pct) VALUES ($1,$2,$3,$4,$5)', [engineerIds[1], p1Id, '2026-01-05', '2026-06-30', 100]); // Marcus
    await pool.query('INSERT INTO assignments (engineer_id, project_id, start_date, end_date, allocation_pct) VALUES ($1,$2,$3,$4,$5)', [engineerIds[4], p1Id, '2026-01-05', '2026-04-30', 75]);  // Sofia
    await pool.query('INSERT INTO assignments (engineer_id, project_id, start_date, end_date, allocation_pct) VALUES ($1,$2,$3,$4,$5)', [engineerIds[0], p1Id, '2026-02-01', '2026-06-30', 50]);  // Priya

    // Project 2: Data Platform Migration
    const { rows: p2Rows } = await pool.query(
      'INSERT INTO projects (name, description, start_date, end_date, total_effort_days) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [
        'Data Platform Migration',
        'Consolidate three separate data warehouses into a unified lakehouse on AWS. Deliver real-time ingestion pipelines, self-serve analytics, and a governed data catalogue.',
        '2026-03-01', '2026-10-31', 180
      ]
    );
    const p2Id = p2Rows[0].id;
    for (const [skillName, effort] of [['Python', 60], ['SQL', 50], ['AWS', 40], ['Docker', 20], ['TypeScript', 10]]) {
      const sid = await getSkillId(skillName);
      if (sid) await pool.query('INSERT INTO project_skills (project_id, skill_id, effort_days) VALUES ($1,$2,$3)', [p2Id, sid, effort]);
    }
    await pool.query('INSERT INTO assignments (engineer_id, project_id, start_date, end_date, allocation_pct) VALUES ($1,$2,$3,$4,$5)', [engineerIds[2], p2Id, '2026-03-01', '2026-10-31', 100]); // Aisha
    await pool.query('INSERT INTO assignments (engineer_id, project_id, start_date, end_date, allocation_pct) VALUES ($1,$2,$3,$4,$5)', [engineerIds[0], p2Id, '2026-04-01', '2026-10-31', 50]);  // Priya

    // Project 3: Mobile App Rebuild
    const { rows: p3Rows } = await pool.query(
      'INSERT INTO projects (name, description, start_date, end_date, total_effort_days) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [
        'Mobile App Rebuild',
        'Full rebuild of the customer-facing mobile application using React Native and a new TypeScript API layer. Includes biometric auth, offline support, and a redesigned payments flow.',
        '2026-05-01', '2026-12-31', 160
      ]
    );
    const p3Id = p3Rows[0].id;
    for (const [skillName, effort] of [['React', 60], ['TypeScript', 50], ['Node.js', 30], ['SQL', 20]]) {
      const sid = await getSkillId(skillName);
      if (sid) await pool.query('INSERT INTO project_skills (project_id, skill_id, effort_days) VALUES ($1,$2,$3)', [p3Id, sid, effort]);
    }
    await pool.query('INSERT INTO assignments (engineer_id, project_id, start_date, end_date, allocation_pct) VALUES ($1,$2,$3,$4,$5)', [engineerIds[3], p3Id, '2026-05-01', '2026-12-31', 100]); // Tom
    await pool.query('INSERT INTO assignments (engineer_id, project_id, start_date, end_date, allocation_pct) VALUES ($1,$2,$3,$4,$5)', [engineerIds[2], p3Id, '2026-07-01', '2026-12-31', 75]);  // Aisha
    await pool.query('INSERT INTO assignments (engineer_id, project_id, start_date, end_date, allocation_pct) VALUES ($1,$2,$3,$4,$5)', [engineerIds[4], p3Id, '2026-05-01', '2026-12-31', 50]);  // Sofia

    console.log('Seeded engineers, projects, and assignments.');
  }
}

async function forceSeed() {
  await pool.query(`
    TRUNCATE assignments, project_skills, engineer_skills, projects, engineers, skills RESTART IDENTITY CASCADE
  `);
  await seedIfEmpty();
}

module.exports = { pool, initDB, forceSeed };

