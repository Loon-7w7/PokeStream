import "server-only";
/** API pública (servidor) de team. */
export { getTeamView, getTeamWithDeaths, countDeathsByRuns, getSpeciesUsage, getTeamSets, getStorageView, addSetsToBox } from "./server/team.service";
