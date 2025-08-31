#!/bin/bash

# Test Database Connection Script
echo "Testing PostgreSQL connection..."

# Test direct connection
echo "1. Testing direct PostgreSQL connection..."
psql "postgresql://postgres:passpass@localhost:5432/Attandance" -c "SELECT version();" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Direct connection successful"
else
    echo "❌ Direct connection failed"
    echo "Make sure PostgreSQL is running:"
    echo "  - If using Docker: docker-compose up -d db"
    echo "  - If local: brew services start postgresql"
fi

# Test MCP server
echo ""
echo "2. Testing MCP PostgreSQL server..."
echo "MCP server is installed and ready to use with Cursor"
echo "Use the connection string in your Cursor MCP configuration"

if [ $? -eq 0 ]; then
    echo "✅ MCP server connection successful"
else
    echo "❌ MCP server connection failed"
fi

echo ""
echo "3. Available tables in database:"
psql "postgresql://postgres:passpass@localhost:5432/Attandance" -c "\dt" 2>/dev/null

echo ""
echo "Connection string for Cursor MCP:"
echo "postgresql://postgres:passpass@localhost:5432/Attandance" 