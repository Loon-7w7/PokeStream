import "server-only";
/** API pública (servidor) de team. */
export { getTeamView, getTeamByRunId, countDeathsByRunId, getTeamSets, getStorageView, addSetsToBox } from "./server/team.service";
