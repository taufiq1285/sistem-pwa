#!/bin/bash

# Delete Test Users from Supabase Auth
# Replace YOUR_SERVICE_ROLE_KEY with your actual service role key

SUPABASE_URL="https://rkyoifqbfcztnhevpnpx.supabase.co"
SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"  # Get from Supabase Dashboard > Settings > API

# User IDs to delete
USERS=(
  "ea127368-9173-4838-9869-8617beb18c4f"  # Asti
  "5de02c2b-0cbf-46a2-9b8e-7909096d70a2"  # mahasiswa
  "7eb7eead-29e8-48aa-b8be-758b561d35cf"  # Super Admin
)

echo "🗑️  Deleting test users from Supabase Authentication..."
echo ""

for USER_ID in "${USERS[@]}"
do
  echo "Deleting user: $USER_ID"

  curl -X DELETE \
    "${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}"

  echo ""
  echo "---"
done

echo ""
echo "✅ Deletion process completed!"
