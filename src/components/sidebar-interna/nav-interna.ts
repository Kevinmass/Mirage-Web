import {
  Bell,
  Building2,
  FileText,
  FolderKanban,
  Inbox,
  ListChecks,
  Network,
  Users,
} from "lucide-react";

export const NAV_INTERNA = [
  { href: "/app/personas", etiqueta: "Personas", icono: Users },
  { href: "/app/organigrama", etiqueta: "Organigrama", icono: Network },
  { href: "/app/clientes", etiqueta: "Clientes", icono: Building2 },
  { href: "/app/proyectos", etiqueta: "Proyectos", icono: FolderKanban },
  { href: "/app/contenido", etiqueta: "Contenido", icono: FileText },
  { href: "/app/tareas", etiqueta: "Tareas", icono: ListChecks },
  { href: "/app/solicitudes", etiqueta: "Solicitudes", icono: Inbox },
  { href: "/app/notificaciones", etiqueta: "Notificaciones", icono: Bell },
] as const;
