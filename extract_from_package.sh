#!/bin/bash

PKG=$1
ADDR=$2

if [ -z "$PKG" ] || [ -z "$ADDR" ]; then
  echo "Usage: bash extract_from_package.sh <PACKAGE_ID> <WALLET_ADDRESS>"
  exit 1
fi

echo "-------------------------------------------------------"
echo " ONECHAIN OBJECT EXTRACTOR (PACKAGE-BASED)"
echo "-------------------------------------------------------"
echo
echo "PACKAGE_ID = $PKG"
echo "Wallet     = $ADDR"
echo

echo "[1] Fetching all owned objects..."
OBJECTS=$(one client objects $ADDR 2>/dev/null)

if [ -z "$OBJECTS" ]; then
  echo "❌ ERROR: Could not fetch owned objects."
  exit 1
fi

# Extract object IDs based on type matching
SCORES=$(echo "$OBJECTS" | grep -i "Scores" -A2 | grep -oP '0x[a-fA-F0-9]{64}' | head -1)
AVATAR=$(echo "$OBJECTS" | grep -i "AvatarRegistry" -A2 | grep -oP '0x[a-fA-F0-9]{64}' | head -1)
CHEST=$(echo "$OBJECTS" | grep -i "ChestRegistry" -A2 | grep -oP '0x[a-fA-F0-9]{64}' | head -1)
REWARD=$(echo "$OBJECTS" | grep -i "RewardPool" -A2 | grep -oP '0x[a-fA-F0-9]{64}' | head -1)

echo "-------------------------------------------------------"
echo " EXTRACTED IDs"
echo "-------------------------------------------------------"
echo "PACKAGE_ID                = $PKG"
echo "SCORES_OBJECT_ID          = ${SCORES:-NOT FOUND}"
echo "AVATAR_REGISTRY_OBJECT_ID = ${AVATAR:-NOT FOUND}"
echo "CHEST_REGISTRY_ID         = ${CHEST:-NOT FOUND}"
echo "REWARD_POOL_OBJECT_ID     = ${REWARD:-NOT FOUND}"
echo "CLOCK_OBJECT_ID           = 0x6 (fixed)"
echo "RANDOM_OBJECT_ID          = 0x8 (fixed)"
echo "-------------------------------------------------------"
