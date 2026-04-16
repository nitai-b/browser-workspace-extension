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
    createdAt: typeof tab.createdAt === 'string' ? tab.createdAt : nowIso(),
  };
}

function normalizeProject(project) {
  return {
    id: typeof project.id === 'string' ? project.id : createId(),
    name:
      typeof project.name === 'string' && project.name.trim()
        ? project.name.trim()
        : DEFAULT_PROJECT_NAME,
    notes: typeof project.notes === 'string' ? project.notes : '',
    isArchived: Boolean(project.isArchived),
    createdAt: typeof project.createdAt === 'string' ? project.createdAt : nowIso(),
    updatedAt: typeof project.updatedAt === 'string' ? project.updatedAt : nowIso(),
    tabs: Array.isArray(project.tabs) ? project.tabs.map(normalizeSavedTab) : [],
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
      notes,
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

export async function exportProjects() {
  return getState();
}

export async function importProjects(rawValue) {
  const nextState = normalizeState(rawValue);

  if (!nextState.projects.length) {
    throw new Error('The imported file does not contain any projects.');
  }

  return saveState(nextState);
}
