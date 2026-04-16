function normalizeSearchValue(value) {
  return String(value || '').trim().toLowerCase();
}

function includesQuery(value, query) {
  return normalizeSearchValue(value).includes(query);
}

function getProjectMatches(project, query) {
  const matches = [];

  if (includesQuery(project.name, query)) {
    matches.push('project');
  }

  const matchingNotes = Array.isArray(project.notes)
    ? project.notes.filter((note) => includesQuery(note.title, query) || includesQuery(note.body, query))
    : [];

  if (matchingNotes.length) {
    matches.push('notes');
  }

  const matchingTabs = project.tabs.filter(
    (tab) => includesQuery(tab.title, query) || includesQuery(tab.url, query),
  );

  if (matchingTabs.length) {
    matches.push(`${matchingTabs.length} ${matchingTabs.length === 1 ? 'tab' : 'tabs'}`);
  }

  return {
    matches,
    matchingTabs,
  };
}

export function getSearchResults(projects, rawQuery) {
  const query = normalizeSearchValue(rawQuery);

  if (!query) {
    return {
      query,
      projectIds: new Set(),
      tabIdsByProjectId: new Map(),
      projects: [],
    };
  }

  const tabIdsByProjectId = new Map();
  const matchingProjects = projects
    .map((project) => {
      const { matches, matchingTabs } = getProjectMatches(project, query);

      if (!matches.length) {
        return null;
      }

      tabIdsByProjectId.set(
        project.id,
        new Set(matchingTabs.map((tab) => tab.id)),
      );

      return {
        ...project,
        searchMatches: matches,
      };
    })
    .filter(Boolean);

  return {
    query,
    projectIds: new Set(matchingProjects.map((project) => project.id)),
    tabIdsByProjectId,
    projects: matchingProjects,
  };
}
