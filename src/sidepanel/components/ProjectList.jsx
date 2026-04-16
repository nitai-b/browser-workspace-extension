export default function ProjectList({
  projects,
  selectedProjectId,
  showArchived,
  onSelect,
  onCreateProject,
  onToggleArchivedView,
}) {
  const visibleProjects = projects.filter((project) =>
    showArchived ? project.isArchived : !project.isArchived,
  );

  return (
    <aside className="project-list">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Projects</p>
          <h1>Workspace Organizer</h1>
        </div>
        <button className="secondary-button" onClick={onCreateProject}>
          New project
        </button>
      </div>

      <button className="link-button" onClick={onToggleArchivedView}>
        {showArchived ? 'Show active projects' : 'Show archived projects'}
      </button>

      {visibleProjects.length ? (
        <div className="project-items">
          {visibleProjects.map((project) => (
            <button
              key={project.id}
              className={`project-item ${project.id === selectedProjectId ? 'is-active' : ''}`}
              onClick={() => onSelect(project.id)}
            >
              <span className="project-name">{project.name}</span>
              <span className="project-meta">
                {project.tabs.length} saved {project.tabs.length === 1 ? 'tab' : 'tabs'}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state compact">
          <p>{showArchived ? 'No archived projects yet.' : 'Create a project to start saving tabs.'}</p>
        </div>
      )}
    </aside>
  );
}
