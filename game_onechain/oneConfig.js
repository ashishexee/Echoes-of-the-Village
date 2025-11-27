export const PACKAGE_ID = "0x2fb55b1eee48aacfa4c5a5c0faf8839cacf1b0abc3f20564b9a69105bc808c32";
export const MODULE_NAME = "contract";

// Common object IDs used across the UI - UPDATED WITH NEW IDs
export const SCORES_OBJECT_ID = "0x50420895fd2d38418ba9afd2e99274accd7b338ca69a296c63c93dd425932ebb";           // From init_scores
export const AVATAR_REGISTRY_OBJECT_ID = "0x7914e6a4a13a5faf1284cd38b4979c533c737940bd5ca599062e0ac9a68b934e"; // From init_avatar_registry  
export const CHEST_REGISTRY_ID = "0x208203ed49e920b92a2c8dd1ee17ed9bcfbf173b24107aa002aa6ffe30120a29";          // From init_chest_registry
export const RANDOM_OBJECT_ID = "0x8";
export const TREASURY_OBJECT_ID = "0x672cccd6ebde3ee64da648e5928d79e17ab8d773d97fdf3e654c8146491bd458";   // phase 2 updated
export const CLOCK_OBJECT_ID = "0x6";

// Convenience helper for struct types
export function itemNftStructType(packageId = PACKAGE_ID, moduleName = MODULE_NAME, structName = "ItemNFT") {
  return `${packageId}::${moduleName}::${structName}`;
}
