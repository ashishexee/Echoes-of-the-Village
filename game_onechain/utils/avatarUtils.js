import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, MODULE_NAME } from "../oneConfig.js";

export class AvatarUtils {
  static async getUserAvatar(suiClient, account) {
    if (!suiClient || !account) {
      throw new Error("Wallet not connected");
    }

    try {
      const avatarNFTType = `${PACKAGE_ID}::${MODULE_NAME}::AvatarNFT`;
      const userAvatars = await suiClient.getOwnedObjects({
        owner: account,
        filter: { StructType: avatarNFTType },
        options: { showContent: true },
      });

      if (userAvatars.data.length === 0) {
        return null;
      }

      const avatarObject = userAvatars.data[0];
      const avatarData = {
        objectId: avatarObject.data.objectId,
        avatarId: avatarObject.data.content.fields.avatar_id,
        owner: avatarObject.data.content.fields.owner,
      };

      return avatarData;
    } catch (error) {
      console.error("Error fetching avatar:", error);
      throw error;
    }
  }

  // CHANGE: Use mc_ prefix instead of avatar_
  static getAvatarImageKey(avatarId) {
    return `mc_${avatarId}`;
  }

  static getAvatarDisplayName(avatarId) {
    return `Avatar #${avatarId}`;
  }
}
