#!/bin/bash
# Setup Vercel Environment Variables
# Run this script to set environment variables in Vercel

echo "🔧 Setting up Vercel environment variables..."

vercel env add VITE_SUPABASE_URL production <<EOF
https://rkyoifqbfcztnhevpnpx.supabase.co
EOF

vercel env add VITE_SUPABASE_URL preview <<EOF
https://rkyoifqbfcztnhevpnpx.supabase.co
EOF

vercel env add VITE_SUPABASE_URL development <<EOF
https://rkyoifqbfcztnhevpnpx.supabase.co
EOF

vercel env add VITE_SUPABASE_ANON_KEY production <<EOF
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJreW9pZnFiZmN6dG5oZXZwbnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NDQyNDMsImV4cCI6MjA3NjMyMDI0M30.-P894i9DGQdkSl-_4gu9rJL9vu0SPnRMDy4yK5grw-E
EOF

vercel env add VITE_SUPABASE_ANON_KEY preview <<EOF
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJreW9pZnFiZmN6dG5oZXZwbnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NDQyNDMsImV4cCI6MjA3NjMyMDI0M30.-P894i9DGQdkSl-_4gu9rJL9vu0SPnRMDy4yK5grw-E
EOF

vercel env add VITE_SUPABASE_ANON_KEY development <<EOF
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJreW9pZnFiZmN6dG5oZXZwbnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NDQyNDMsImV4cCI6MjA3NjMyMDI0M30.-P894i9DGQdkSl-_4gu9rJL9vu0SPnRMDy4yK5grw-E
EOF

vercel env add VITE_APP_NAME production <<EOF
Sistem Praktikum PWA
EOF

vercel env add VITE_APP_NAME preview <<EOF
Sistem Praktikum PWA
EOF

vercel env add VITE_APP_NAME development <<EOF
Sistem Praktikum PWA
EOF

vercel env add VITE_APP_VERSION production <<EOF
1.0.0
EOF

vercel env add VITE_APP_VERSION preview <<EOF
1.0.0
EOF

vercel env add VITE_APP_VERSION development <<EOF
1.0.0
EOF

vercel env add VITE_APP_ENV production <<EOF
production
EOF

echo "✅ Environment variables set! Now redeploy with: vercel --prod"
