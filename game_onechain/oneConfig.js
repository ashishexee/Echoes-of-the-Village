import { API_BASE_URL } from "./api";

export const PACKAGE_ID =
  "0xcaf20ed5933ffc2dfb78b5c61f03ee296e16afafd187ec3d780037104773173e";

export const MODULE_NAME = "contracts";

// ---------- UPDATED ON-CHAIN OBJECT IDs ----------
export const SCORES_OBJECT_ID =
  "0x4b95d0d6a71ad41ccc4957cb9b42f4fe42f39ebecb15d388ca3eb401badd3f60";

export const AVATAR_REGISTRY_OBJECT_ID =
  "0xc58e94a98da35eaf1b1735d7497e7cab11445be50e00cebb163ba3417e5d5028";

export const CHEST_REGISTRY_ID =
  "0x157716dfdbd8720fd7ec13c7785e2023c185c9c8e016917f1f53fc4573ea8300";

export const REWARD_POOL_OBJECT_ID =
  "0x99be9f1f7c996738a6c2e1e1fd273af5b40522deee411bcf7cbba476c2da0282";

// ---------- FIXED CONSTANTS ----------
export const RANDOM_OBJECT_ID = "0x8";
export const CLOCK_OBJECT_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000006";

export const BACKEND_API_URL = API_BASE_URL;

export function itemNftStructType(
  packageId = PACKAGE_ID,
  moduleName = MODULE_NAME,
  structName = "ItemNFT"
) {
  return `${packageId}::${moduleName}::${structName}`;
}
