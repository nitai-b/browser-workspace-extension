import { DEFAULT_PROJECT_NAME, DEFAULT_STATE, STORAGE_KEY } from './constants.js';
import { createId, nowIso } from './utils.js';

function cloneDefaultState() {
  return structuredClone(DEFAULT_STATE);
}

function normalizeSavedTab(tab) {
  return {
    id: typeof tab.id === 'string' ? tab.id : createId(),
    title: typeof tab.title === 'string' && tab.title.trim() ? tab.title : 'Untitled tab',
    url: typeof tab.url === 'string' ? tab.url : '',
    favIconUrl: typeof tab.favIconUrl === 'string' ? tab.favIconUrl : '',
    browserTabId: typeof tab.browserTabId === 'number' ? tab.browserTabId : null,
    browserWindowId: typeof tab.browserWindowId === 'number' ? tab.browserWindowId : null,
    createdAt: typeof tab.createdAt === 'string' ? tab.createdAt : nowIso(),
    updatedAt: typeof tab.updatedAt === 'string' ? tab.updatedAt : nowIso(),
  };
}

function normalizeProjectNote(note) {
  const now = nowIso();

  return {
    id: typeof note.id === 'string' ? note.id : createId(),
    title: typeof note.title === 'string' ? note.title : '',
    body: typeof note.body === 'string' ? note.body : '',
    createdAt: typeof note.createdAt === 'string' ? note.createdAt : now,
    updatedAt: typeof note.updatedAt === 'string' ? note.updatedAt : now,
  };
}

function normalizeProjectNotes(project) {
  if (Array.isArray(project.notes)) {
    return project.notes.map(normalizeProjectNote);
  }

  if (typeof project.notes === 'string' && project.notes.trim()) {
    const now = nowIso();

    return [
      normalizeProjectNote({
        title: 'Project note',
        body: project.notes,
        createdAt: now,
        updatedAt: now,
      }),
    ];
  }

  return [];
}

function normalizeProject(project) {
  return {
    id: typeof project.id === 'string' ? project.id : createId(),
    name:
      typeof project.name === 'string' && project.name.trim()
        ? project.name.trim()
        : DEFAULT_PROJECT_NAME,
    notes: normalizeProjectNotes(project),
    isArchived: Boolean(project.isArchived),
    createdAt: typeof project.createdAt === 'string' ? project.createdAt : nowIso(),
    updatedAt: typeof project.updatedAt === 'string' ? project.updatedAt : nowIso(),
    tabs: Array.isArray(project.tabs) ? project.tabs.map(normalizeSavedTab) : [],
  };
}

function getTabMergeKey(tab) {
  return tab.url;
}

function getNoteMergeKey(note) {
  return `${note.title.trim().toLowerCase()}\n${note.body.trim()}`;
}

function mergeByKey(existingItems, incomingItems, getKey) {
  const keys = new Set(existingItems.map(getKey).filter(Boolean));
  const mergedItems = [...existingItems];
  let addedCount = 0;
  let skippedCount = 0;

  for (const incomingItem of incomingItems) {
    const key = getKey(incomingItem);

    if (key && keys.has(key)) {
      skippedCount += 1;
      continue;
    }

    if (key) {
      keys.add(key);
    }

    mergedItems.push(incomingItem);
    addedCount += 1;
  }

  return {
    items: mergedItems,
    addedCount,
    skippedCount,
  };
}

function mergeProject(existingProject, incomingProject) {
  const tabMerge = mergeByKey(existingProject.tabs, incomingProject.tabs, getTabMergeKey);
  const noteMerge = mergeByKey(existingProject.notes, incomingProject.notes, getNoteMergeKey);
  const changed = tabMerge.addedCount > 0 || noteMerge.addedCount > 0;

  return {
    project: changed
      ? {
          ...existingProject,
          isArchived: existingProject.isArchived && incomingProject.isArchived,
          updatedAt: nowIso(),
          tabs: tabMerge.items,
          notes: noteMerge.items,
        }
      : existingProject,
    addedTabs: tabMerge.addedCount,
    skippedTabs: tabMerge.skippedCount,
    addedNotes: noteMerge.addedCount,
    skippedNotes: noteMerge.skippedCount,
  };
}

export function normalizeState(value) {
  if (!value || typeof value !== 'object') {
    return cloneDefaultState();
  }

  const projects = Array.isArray(value.projects)
    ? value.projects.map(normalizeProject)
    : [];

  const selectedProjectId =
    typeof value.selectedProjectId === 'string' &&
    projects.some((project) => project.id === value.selectedProjectId)
      ? value.selectedProjectId
      : projects[0]?.id || null;

  return {
    version: 1,
    selectedProjectId,
    projects,
  };
}

export async function getState() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const state = normalizeState(result[STORAGE_KEY]);

  if (!result[STORAGE_KEY]) {
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
  }

  return state;
}

export async function saveState(state) {
  const normalized = normalizeState(state);
  await chrome.storage.local.set({ [STORAGE_KEY]: normalized });
  return normalized;
}

function updateProjectById(state, projectId, updater) {
  let didUpdate = false;

  const projects = state.projects.map((project) => {
    if (project.id !== projectId) {
      return project;
    }

    didUpdate = true;
    const updated = updater(project);
    return {
      ...updated,
      updatedAt: nowIso(),
    };
  });

  if (!didUpdate) {
    throw new Error('Project not found.');
  }

  return {
    ...state,
    projects,
  };
}

export async function createProject(name = '') {
  const state = await getState();
  const project = normalizeProject({
    id: createId(),
    name: name.trim() || `Project ${state.projects.length + 1}`,
    notes: '',
    isArchived: false,
    tabs: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  return saveState({
    ...state,
    selectedProjectId: project.id,
    projects: [...state.projects, project],
  });
}

export async function renameProject(projectId, name) {
  const state = await getState();
  return saveState(
    updateProjectById(state, projectId, (project) => ({
      ...project,
      name: name.trim() || DEFAULT_PROJECT_NAME,
    })),
  );
}

export async function deleteProject(projectId) {
  const state = await getState();
  const projects = state.projects.filter((project) => project.id !== projectId);
  const selectedProjectId =
    state.selectedProjectId === projectId ? projects[0]?.id || null : state.selectedProjectId;

  return saveState({
    ...state,
    selectedProjectId,
    projects,
  });
}

export async function selectProject(projectId) {
  const state = await getState();
  return saveState({
    ...state,
    selectedProjectId: projectId,
  });
}

export async function updateProjectNotes(projectId, notes) {
  const state = await getState();
  return saveState(
    updateProjectById(state, projectId, (project) => ({
      ...project,
      notes: Array.isArray(notes) ? notes.map(normalizeProjectNote) : normalizeProjectNotes({ notes }),
    })),
  );
}

export async function addProjectNote(projectId, note) {
  const state = await getState();
  const createdAt = nowIso();

  return saveState(
    updateProjectById(state, projectId, (project) => ({
      ...project,
      notes: [
        ...project.notes,
        normalizeProjectNote({
          ...note,
          createdAt,
          updatedAt: createdAt,
        }),
      ],
    })),
  );
}

export async function updateProjectNote(projectId, noteId, updates) {
  const state = await getState();

  return saveState(
    updateProjectById(state, projectId, (project) => ({
      ...project,
      notes: project.notes.map((note) => {
        if (note.id !== noteId) {
          return note;
        }

        return normalizeProjectNote({
          ...note,
          ...updates,
          id: note.id,
          createdAt: note.createdAt,
          updatedAt: nowIso(),
        });
      }),
    })),
  );
}

export async function deleteProjectNote(projectId, noteId) {
  const state = await getState();

  return saveState(
    updateProjectById(state, projectId, (project) => ({
      ...project,
      notes: project.notes.filter((note) => note.id !== noteId),
    })),
  );
}

export async function setProjectArchived(projectId, isArchived) {
  const state = await getState();
  return saveState(
    updateProjectById(state, projectId, (project) => ({
      ...project,
      isArchived,
    })),
  );
}

export async function addTabsToProject(projectId, tabs) {
  const state = await getState();
  return saveState(
    updateProjectById(state, projectId, (project) => ({
      ...project,
      tabs: [...project.tabs, ...tabs],
    })),
  );
}

export async function removeSavedTab(projectId, tabId) {
  const state = await getState();
  return saveState(
    updateProjectById(state, projectId, (project) => ({
      ...project,
      tabs: project.tabs.filter((tab) => tab.id !== tabId),
    })),
  );
}

export async function moveSavedTab(projectId, tabId, direction) {
  const state = await getState();
  return saveState(
    updateProjectById(state, projectId, (project) => {
      const currentIndex = project.tabs.findIndex((tab) => tab.id === tabId);

      if (currentIndex === -1) {
        return project;
      }

      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (nextIndex < 0 || nextIndex >= project.tabs.length) {
        return project;
      }

      const tabs = [...project.tabs];
      const [moved] = tabs.splice(currentIndex, 1);
      tabs.splice(nextIndex, 0, moved);

      return {
        ...project,
        tabs,
      };
    }),
  );
}

export async function moveSavedTabToTop(projectId, tabId) {
  const state = await getState();
  return saveState(
    updateProjectById(state, projectId, (project) => {
      const currentIndex = project.tabs.findIndex((tab) => tab.id === tabId);

      if (currentIndex <= 0) {
        return project;
      }

      const tabs = [...project.tabs];
      const [moved] = tabs.splice(currentIndex, 1);
      tabs.unshift({
        ...moved,
        updatedAt: nowIso(),
      });

      return {
        ...project,
        tabs,
      };
    }),
  );
}

export async function linkSavedTabToBrowserTab(projectId, tabId, browserTab) {
  const state = await getState();
  return saveState(
    updateProjectById(state, projectId, (project) => {
      const currentIndex = project.tabs.findIndex((tab) => tab.id === tabId);

      if (currentIndex === -1) {
        return project;
      }

      const tabs = [...project.tabs];
      const [linkedTab] = tabs.splice(currentIndex, 1);
      tabs.unshift({
        ...linkedTab,
        browserTabId: typeof browserTab.id === 'number' ? browserTab.id : null,
        browserWindowId: typeof browserTab.windowId === 'number' ? browserTab.windowId : null,
        updatedAt: nowIso(),
      });

      return {
        ...project,
        tabs,
      };
    }),
  );
}

export async function linkRestoredTabsToProject(projectId, restoredTabLinks) {
  const state = await getState();
  return saveState(
    updateProjectById(state, projectId, (project) => ({
      ...project,
      tabs: project.tabs.map((savedTab) => {
        const restoredLink = restoredTabLinks.find((link) => link.savedTabId === savedTab.id);
        const browserTab = restoredLink?.browserTab;

        if (!browserTab) {
          return savedTab;
        }

        return {
          ...savedTab,
          browserTabId: typeof browserTab.id === 'number' ? browserTab.id : null,
          browserWindowId: typeof browserTab.windowId === 'number' ? browserTab.windowId : null,
        };
      }),
    })),
  );
}

export async function exportProjects() {
  return getState();
}

export async function importProjects(rawValue) {
  const importedState = normalizeState(rawValue);

  if (!importedState.projects.length) {
    throw new Error('The imported file does not contain any projects.');
  }

  const currentState = await getState();
  const projects = [...currentState.projects];
  const projectIds = new Set(projects.map((project) => project.id));
  const projectIndexesById = new Map(projects.map((project, index) => [project.id, index]));
  const projectIndexesByName = new Map(
    projects.map((project, index) => [project.name.trim().toLowerCase(), index]),
  );
  const summary = {
    addedProjects: 0,
    mergedProjects: 0,
    skippedProjects: 0,
    addedTabs: 0,
    skippedTabs: 0,
    addedNotes: 0,
    skippedNotes: 0,
  };

  for (const incomingProject of importedState.projects) {
    const projectNameKey = incomingProject.name.trim().toLowerCase();
    const existingIndex = projectIndexesById.has(incomingProject.id)
      ? projectIndexesById.get(incomingProject.id)
      : projectIndexesByName.get(projectNameKey);

    if (typeof existingIndex === 'number') {
      const merge = mergeProject(projects[existingIndex], incomingProject);
      projects[existingIndex] = merge.project;
      summary.addedTabs += merge.addedTabs;
      summary.skippedTabs += merge.skippedTabs;
      summary.addedNotes += merge.addedNotes;
      summary.skippedNotes += merge.skippedNotes;

      if (merge.addedTabs || merge.addedNotes) {
        summary.mergedProjects += 1;
      } else {
        summary.skippedProjects += 1;
      }

      continue;
    }

    let project = incomingProject;

    if (projectIds.has(project.id)) {
      project = {
        ...project,
        id: createId(),
      };
    }

    projects.push(project);
    const nextIndex = projects.length - 1;
    projectIds.add(project.id);
    projectIndexesById.set(project.id, nextIndex);
    projectIndexesByName.set(projectNameKey, nextIndex);
    summary.addedProjects += 1;
    summary.addedTabs += project.tabs.length;
    summary.addedNotes += project.notes.length;
  }

  const selectedProjectId =
    currentState.selectedProjectId ||
    importedState.selectedProjectId ||
    projects[0]?.id ||
    null;
  const state = await saveState({
    ...currentState,
    selectedProjectId,
    projects,
  });

  return {
    state,
    summary,
  };
}
