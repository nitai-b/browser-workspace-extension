export function createId() {
  return crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

export function sortProjects(projects) {
  return [...projects].sort((a, b) => {
    if (a.isArchived !== b.isArchived) {
      return Number(a.isArchived) - Number(b.isArchived);
    }

    return a.name.localeCompare(b.name);
  });
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
