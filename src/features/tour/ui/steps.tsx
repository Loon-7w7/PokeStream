// Pasos del tour del panel. Cada paso apunta a un elemento con `data-tour="<id>"`
// (esos atributos viven en la UI de cada feature; si renombras uno, cámbialo aquí).
import type { Step } from "react-joyride";
import { Kbd } from "@/core/ui/Kbd";

const at = (id: string) => `[data-tour="${id}"]`;

export const TOUR_STEPS: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "¡Bienvenido al panel!",
    content: "Aquí controlas el equipo que ve tu chat en OBS. Te enseño lo básico en un minuto.",
  },
  {
    target: at("team"),
    title: "Tu equipo",
    content:
      "Los 6 slots de tu equipo. Pulsa un slot vacío para agregar un Pokémon; en uno ocupado puedes reemplazarlo, editarlo o marcarlo como debilitado. Arrástralos para cambiar el orden.",
  },
  {
    target: at("team-shortcuts"),
    title: "Atajos de teclado",
    content: (
      <>
        Para ir rápido en directo: <Kbd>1</Kbd>–<Kbd>6</Kbd> elige un slot, <Kbd>R</Kbd> lo reemplaza, <Kbd>E</Kbd> lo edita y <Kbd>F</Kbd> lo debilita.
      </>
    ),
  },
  {
    target: at("storage"),
    title: "Caja y Muertos",
    content: "Los Pokémon que salen del equipo van a la caja. Pulsa uno para meterlo en un slot. En modo Nuzlocke, los que mueren van a Muertos.",
  },
  {
    target: at("nuzlocke"),
    title: "Modo Nuzlocke",
    content: "Actívalo si juegas un Nuzlocke: un Pokémon debilitado ya no puede revivir y podrás mostrar un contador de muertes en el widget. Una vez activo, solo una nueva partida lo apaga.",
  },
  {
    target: at("new-game"),
    title: "Nueva partida",
    content: "Vacía el equipo, la caja y Muertos para empezar de cero. La configuración del widget y la URL de OBS se conservan.",
  },
  {
    target: at("widget-url"),
    title: "Añádelo a OBS",
    content: "Copia esta URL y en OBS crea una fuente de Navegador de 1920 × 1080. No la compartas: quien la tenga ve tu equipo.",
  },
  {
    target: at("widget-options"),
    title: "Personaliza el widget",
    content:
      "Elige la distribución: con «Posición libre» colocas cada Pokémon donde quieras. Debajo ajustas opacidad, escala y qué se muestra. Todo se actualiza en vivo en OBS.",
  },
  {
    target: at("showdown"),
    title: "Pokémon Showdown",
    content: "Exporta tu equipo en formato Showdown o importa sets a la caja pegando el texto.",
  },
  {
    target: at("tour"),
    title: "¡Listo!",
    content: "Puedes repetir este tour cuando quieras desde este botón.",
  },
];
