/**
 * `$id` de la Team Appwrite du client pour qui l'importeur Sygefor a été développé.
 * Doit rester synchronisé avec le nom du dossier de route Nitro
 * `server/api/third-party/sygefor-33/` : `SygeforImporter.vue` construit ses URLs à
 * partir de l'id de team (`/api/third-party/${organization}/list`), donc toute autre
 * organisation tomberait sur un 404.
 *
 * L'`organizationId` de l'API Sygefor, lui, vit dans `SygeforImporterConfig.js`,
 * à côté des routes qui le consomment.
 */
export const sygeforTeamId = 'sygefor-33'
