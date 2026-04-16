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

export function getJsonByteSize(value) {
  return new Blob([JSON.stringify(value)]).size;
}

export function formatByteSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const formatted = unitIndex === 0 ? String(size) : size.toFixed(size < 10 ? 1 : 0);
  return `${formatted} ${units[unitIndex]}`;
}

export function getFormattedJsonSize(value) {
  return formatByteSize(getJsonByteSize(value));
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
