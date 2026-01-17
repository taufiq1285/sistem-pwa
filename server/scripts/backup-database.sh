#!/bin/bash
# ============================================================================
# Database Backup Script - Week 3 Pre-Migration
# ============================================================================
# Usage: bash scripts/backup-database.sh
# ============================================================================

set -e  # Exit on error

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_pre_week3_${TIMESTAMP}.sql"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "============================================================================"
echo "Database Backup Script - Week 3 RLS Migration"
echo "============================================================================"
echo ""

# Create backup directory if not exists
mkdir -p ${BACKUP_DIR}

echo -e "${YELLOW}📦 Creating backup directory...${NC}"
echo "Backup will be saved to: ${BACKUP_FILE}"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found!${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Backup database
echo -e "${YELLOW}💾 Starting database backup...${NC}"
echo "This may take a few minutes..."
echo ""

supabase db dump -f ${BACKUP_FILE}

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
    echo ""
    echo "Backup file: ${BACKUP_FILE}"
    echo "File size: $(du -h ${BACKUP_FILE} | cut -f1)"
    echo ""

    # Create policies-only backup
    echo -e "${YELLOW}📋 Creating policies-only backup...${NC}"
    POLICIES_FILE="${BACKUP_DIR}/backup_policies_${TIMESTAMP}.sql"

    # Extract just the policies
    supabase db dump -f ${POLICIES_FILE} --schema public --data-only=false

    echo -e "${GREEN}✅ Policies backup created: ${POLICIES_FILE}${NC}"
    echo ""

    # Summary
    echo "============================================================================"
    echo -e "${GREEN}🎉 Backup Complete!${NC}"
    echo "============================================================================"
    echo ""
    echo "Backup files created:"
    echo "  1. Full backup:     ${BACKUP_FILE}"
    echo "  2. Policies backup: ${POLICIES_FILE}"
    echo ""
    echo "To restore if needed:"
    echo "  psql \$DATABASE_URL < ${BACKUP_FILE}"
    echo ""
    echo -e "${GREEN}You can now safely run the RLS migrations!${NC}"
    echo "============================================================================"
else
    echo ""
    echo -e "${RED}❌ Backup failed!${NC}"
    echo "Please check your Supabase connection and try again."
    exit 1
fi
