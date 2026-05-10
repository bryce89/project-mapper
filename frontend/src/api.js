const BASE = '/api';
async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  getSkills: () => req('GET', '/skills'),
  createSkill: (name) => req('POST', '/skills', { name }),
  updateSkill: (id, name) => req('PUT', `/skills/${id}`, { name }),
  deleteSkill: (id) => req('DELETE', `/skills/${id}`),
  getEngineers: (p = {}) => req('GET', '/engineers?' + new URLSearchParams(p)),
  getEngineer: (id) => req('GET', `/engineers/${id}`),
  createEngineer: (d) => req('POST', '/engineers', d),
  updateEngineer: (id, d) => req('PUT', `/engineers/${id}`, d),
  deleteEngineer: (id) => req('DELETE', `/engineers/${id}`),
  getProjects: (p = {}) => req('GET', '/projects?' + new URLSearchParams(p)),
  getProject: (id) => req('GET', `/projects/${id}`),
  createProject: (d) => req('POST', '/projects', d),
  updateProject: (id, d) => req('PUT', `/projects/${id}`, d),
  deleteProject: (id) => req('DELETE', `/projects/${id}`),
  getAssignments: (p = {}) => req('GET', '/assignments?' + new URLSearchParams(p)),
  createAssignment: (d) => req('POST', '/assignments', d),
  updateAssignment: (id, d) => req('PUT', `/assignments/${id}`, d),
  deleteAssignment: (id) => req('DELETE', `/assignments/${id}`),
};
