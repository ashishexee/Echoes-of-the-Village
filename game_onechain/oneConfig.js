export const PACKAGE_ID = "0x65a9835891138bd2652cd677397245372c14925238d6b34c991d64290743d05a";
export const MODULE_NAME = "contracts";

// Common object IDs used across the UI - UPDATED WITH NEW IDs
export const SCORES_OBJECT_ID = "0xc35baea56490e90fe415cd83a686adacec82b2845c1e0a2200eae9fabec4e72c";           // From init_scores
export const AVATAR_REGISTRY_OBJECT_ID = "0xf257166042c4ba31f2873647f8c0efb83e0e225b5d89ca5690d9b6a3d63b6596"; // From init_avatar_registry  
export const CHEST_REGISTRY_ID = "0x7ac289adddafeb5fd30c8801a36447cf4e28c01d67224d1e8350321af0de43b9";          // From init_chest_registry
export const RANDOM_OBJECT_ID = "0x8";

// Convenience helper for struct types
export function itemNftStructType(packageId = PACKAGE_ID, moduleName = MODULE_NAME, structName = "ItemNFT") {
  return `${packageId}::${moduleName}::${structName}`;
}
