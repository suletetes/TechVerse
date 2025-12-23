#!/usr/bin/env node

/**
 * Script to reduce console logs in client and server code
 * Keeps: console.error, console.warn for critical issues
 * Removes/Comments: console.log, console.info, console.debug for routine operations
 */

const fs = require('fs');
const path = require('path');

const PATTERNS_TO_REDUCE = [
    // Keep these patterns (critical logs)
    /console\.error\(/,
    /console\.warn\(/,
    
    // Reduce these patterns (verbose logs)
    /console\.log\(/,
    /console\.info\(/,
    /console\.debug\(/,
];

const DIRECTORIES_TO_PROCESS = [
    'client/src/components/Admin',
    'client/src/api',
    'client/src/services',
    'client/src/hooks',
    'server/controllers',
    'server/middleware',
    'server/services',
    'server/routes',
];

function shouldKeepLog(line) {
    // Keep error and warn logs
    if (line.includes('console.error') || line.includes('console.warn')) {
        return true;
    }
    
    // Keep logs that seem important (contain ERROR, CRITICAL, FATAL)
    if (/ERROR|CRITICAL|FATAL|SECURITY/i.test(line)) {
        return true;
    }
    
    return false;
}

function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        let modified = false;
        
        const newLines = lines.map(line => {
            // Skip if already commented
            if (line.trim().startsWith('//')) {
                return line;
            }
            
            // Check if line contains console.log/info/debug
            if (/console\.(log|info|debug)\(/.test(line) && !shouldKeepLog(line)) {
                modified = true;
                // Comment out the line
                const indent = line.match(/^\s*/)[0];
                return `${indent}// ${line.trim()}`;
            }
            
            return line;
        });
        
        if (modified) {
            fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
            console.log(`✓ Reduced logs in: ${filePath}`);
            return 1;
        }
        
        return 0;
    } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
        return 0;
    }
}

function processDirectory(dir) {
    let filesModified = 0;
    
    if (!fs.existsSync(dir)) {
        console.log(`⚠ Directory not found: ${dir}`);
        return 0;
    }
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
            filesModified += processDirectory(fullPath);
        } else if (file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.jsx'))) {
            filesModified += processFile(fullPath);
        }
    }
    
    return filesModified;
}

function main() {
    console.log('🔧 Starting log reduction process...\n');
    
    let totalFilesModified = 0;
    
    for (const dir of DIRECTORIES_TO_PROCESS) {
        console.log(`\n📁 Processing: ${dir}`);
        const modified = processDirectory(dir);
        totalFilesModified += modified;
    }
    
    console.log(`\n✅ Log reduction complete!`);
    console.log(`📊 Files modified: ${totalFilesModified}`);
    console.log(`\nNote: console.error() and console.warn() statements were preserved.`);
}

main();
