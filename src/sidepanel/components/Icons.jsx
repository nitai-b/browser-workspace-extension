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

export function PlusIcon() {
  return (
    <BaseIcon>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
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

export function PinIcon({ filled = false }) {
  return (
    <svg
      className="button-icon"
      viewBox="0 0 90 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d={
          filled
            ? 'M89.011 87.739c-.599-1.371-1.294-2.652-1.968-3.891l-.186-.343-15.853-15.91a197.11 197.11 0 0 0-1.12-1.12 118.746 118.746 0 0 1-1.997-2.018l-1.459-1.437 23.316-23.317-1.704-1.704c-9.111-9.112-22.925-12.518-35.353-8.759l-6.36-6.359c.769-7.805-2.017-15.69-7.503-21.175L37.123 0 0 37.122l1.706 1.704c5.487 5.487 13.368 8.271 21.176 7.503l6.36 6.36C25.484 65.115 28.889 78.93 38 88.041l1.703 1.704 23.316-23.316 1.438 1.458c.679.653 1.344 1.321 2.009 1.989.373.374.745.748 1.117 1.116l15.699 15.7.566.352c1.239.673 2.52 1.369 3.891 1.968L90 90l-.989-2.261z'
            : 'm84.303 82.191-6.492-6.492-6.492-6.492c-1.077-1.087-2.175-2.153-3.235-3.257a1.07 1.07 0 0 0-.047-.025l-2.154-2.154L90 39.653l-1.056-1.056c-9.367-9.368-23.457-12.705-36.139-8.632l-7.345-7.344c.929-7.947-1.815-15.958-7.422-21.565L36.983 0 0 36.982l1.057 1.056c5.606 5.606 13.614 8.353 21.565 7.422l7.345 7.345c-4.073 12.681-.737 26.772 8.631 36.139L39.653 90 63.77 65.883l2.155 2.155.025.046c1.1 1.058 2.164 2.152 3.247 3.226l8.081 8.081 4.912 4.912 3.246 3.246c1.403.761 2.796 1.532 4.302 2.19-.658-1.506-1.429-2.899-2.19-4.302l-3.245-3.246zM33.086 52.897l.311-.886-9.714-9.714-.742.108c-6.763.987-13.633-1.042-18.681-5.459L36.948 4.26c4.415 5.047 6.447 11.92 5.458 18.68l-.108.742 9.714 9.714.886-.311c11.361-3.984 24.084-1.387 32.853 6.593L39.678 85.75c-7.98-8.769-10.576-21.496-6.592-32.853z'
        }
      />
    </svg>
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
