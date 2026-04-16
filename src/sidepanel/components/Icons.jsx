function BaseIcon({ children }) {
  return (
    <svg
      className="button-icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function SaveIcon() {
  return (
    <BaseIcon>
      <path d="M5 4.75h11l3 3v11.5A1.75 1.75 0 0 1 17.25 21h-10.5A1.75 1.75 0 0 1 5 19.25V4.75Z" />
      <path d="M8 4.75v5h7v-5" />
      <path d="M9 16h6" />
    </BaseIcon>
  );
}

export function RestoreIcon() {
  return (
    <BaseIcon>
      <path d="M3 12a9 9 0 1 0 3.2-6.9" />
      <path d="M3 4.5v5h5" />
    </BaseIcon>
  );
}

export function ImportIcon() {
  return (
    <BaseIcon>
      <path d="M12 3v12" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M5 19.25h14" />
    </BaseIcon>
  );
}

export function ExportIcon() {
  return (
    <BaseIcon>
      <path d="M12 16V4" />
      <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
      <path d="M5 19.25h14" />
    </BaseIcon>
  );
}

export function EditIcon() {
  return (
    <BaseIcon>
      <path d="m4 20 4.5-1 9-9a2.12 2.12 0 1 0-3-3l-9 9L4 20Z" />
      <path d="m13.5 7.5 3 3" />
    </BaseIcon>
  );
}

export function ArchiveIcon() {
  return (
    <BaseIcon>
      <path d="M4.75 6.25h14.5v3.5H4.75z" />
      <path d="M6.5 9.75v8.5c0 .97.78 1.75 1.75 1.75h7.5c.97 0 1.75-.78 1.75-1.75v-8.5" />
      <path d="M10 13h4" />
    </BaseIcon>
  );
}

export function DeleteIcon() {
  return (
    <BaseIcon>
      <path d="M5.5 7.25h13" />
      <path d="M9 4.75h6" />
      <path d="M8 7.25v11c0 .97.78 1.75 1.75 1.75h4.5c.97 0 1.75-.78 1.75-1.75v-11" />
      <path d="M10 10.5v5.5" />
      <path d="M14 10.5v5.5" />
    </BaseIcon>
  );
}
