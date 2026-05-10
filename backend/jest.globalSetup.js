async function setup() {
  process.env.NODE_ENV = 'test';
  process.env.PGDATABASE = 'project_mapper_test';
  // initDB creates the schema in the test database
  const { initDB } = require('./db');
  await initDB();
}

module.exports = setup;
