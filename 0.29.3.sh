#!/bin/bash

# Dokploy Security Migration Script
# Configures a unique BETTER_AUTH_SECRET for Dokploy installations

set -e

SECRET_FILE="/etc/dokploy/secrets/auth_secret"

# Check if running as root
if [ "$(id -u)" != "0" ]; then
    echo "Error: This script must be run as root" >&2
    exit 1
fi

# Check if Dokploy is installed
if ! docker service ls 2>/dev/null | grep -q dokploy; then
    echo "Error: Dokploy service not found. Is Dokploy installed?" >&2
    exit 1
fi

persist_auth_secret() {
    local secret="$1"
    local secret_dir
    secret_dir="$(dirname "$SECRET_FILE")"

    mkdir -p "$secret_dir"
    chmod 700 "$secret_dir"
    (
        umask 077
        printf '%s\n' "$secret" > "$SECRET_FILE"
    )
    chmod 600 "$SECRET_FILE"
}

load_auth_secret_from_service() {
    local container_id=""
    container_id=$(docker ps --filter "label=com.docker.swarm.service.name=dokploy" --format '{{.ID}}' | head -n1)

    if [ -z "$container_id" ]; then
        return 1
    fi

    docker exec "$container_id" cat /run/secrets/dokploy-auth-secret 2>/dev/null
}

# Check if already configured
if docker secret ls 2>/dev/null | grep -q "dokploy-auth-secret"; then
    if [ -r "$SECRET_FILE" ]; then
        echo "✅ Auth secret is already configured!"
        echo "   (Docker Secrets + persisted at $SECRET_FILE)"
        echo ""
        exit 0
    fi

    # Secret exists in Swarm but is missing on disk — backfill so install.sh can
    # recover it on a future reinstall (Swarm Raft state is wiped on re-init).
    echo "🔄 Auth secret exists in Docker Secrets but is not persisted on disk."
    echo "   Backing it up to $SECRET_FILE for disaster recovery..."

    EXISTING_SECRET=$(load_auth_secret_from_service || true)
    if [ -z "$EXISTING_SECRET" ]; then
        echo "❌ Could not read the existing auth secret from a running Dokploy container." >&2
        echo "   Make sure the dokploy service is running and try again." >&2
        exit 1
    fi

    persist_auth_secret "$EXISTING_SECRET"
    echo "✅ Auth secret persisted to $SECRET_FILE"
    echo ""
    exit 0
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Dokploy Auth Secret Migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "👋 This script will generate a unique auth secret for your"
echo "   Dokploy installation and migrate any existing 2FA data."
echo ""

# Generate new secret
echo "🔐 Generating secure auth secret..."
NEW_SECRET=$(openssl rand -hex 32)

# Persist on disk first so install.sh can recover it after a Swarm re-init
persist_auth_secret "$NEW_SECRET"
echo "✅ Auth secret persisted to $SECRET_FILE (chmod 600)"

# Store in Docker Secret
echo "$NEW_SECRET" | docker secret create dokploy-auth-secret -
echo "✅ Auth secret saved in Docker Secrets"

# Run 2FA migration inside the Dokploy container
echo "🔄 Migrating existing 2FA records..."
DOKPLOY_CONTAINER=$(docker ps --filter "name=dokploy" --format "{{.ID}}" | head -n1)

if [ -n "$DOKPLOY_CONTAINER" ]; then
    docker exec \
        -e OLD_SECRET=better-auth-secret-123456789 \
        -e NEW_SECRET="$NEW_SECRET" \
        "$DOKPLOY_CONTAINER" \
        sh -c "cd /app && pnpm run migrate-auth-secret"
    echo "✅ 2FA records migrated"
else
    echo "⚠️  Dokploy container not found, skipping 2FA migration"
fi

# Update Dokploy service to use the Docker Secret
echo "🔄 Updating Dokploy service..."
docker service update \
    --secret-add source=dokploy-auth-secret,target=/run/secrets/dokploy-auth-secret \
    --env-add BETTER_AUTH_SECRET_FILE=/run/secrets/dokploy-auth-secret \
    --env-rm BETTER_AUTH_SECRET \
    dokploy

echo "⏳ Waiting for service to restart..."
sleep 5

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All done! Your auth secret is now secured."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 What was configured:"
echo "   • Unique auth secret generated with openssl rand -hex 32"
echo "   • Secret stored in Docker Secrets (encrypted, in-memory only)"
echo "   • Secret persisted to $SECRET_FILE (root-only) for disaster recovery"
echo "   • Existing 2FA records re-encrypted with the new secret"
echo "   • Dokploy service updated to use the new secret"
echo ""
echo "💡 Next steps:"
echo "   • All active sessions have been invalidated — users will need to log in again"
echo "   • 2FA remains fully functional"
echo ""
