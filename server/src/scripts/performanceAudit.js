#!/usr/bin/env node

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import performanceOptimizer from '../utils/performanceOptimizer.js';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

async function runPerformanceAudit() {
  try {
    console.log('🔍 Starting Performance Audit...\n');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database\n');
    
    // Generate comprehensive performance report
    const report = await performanceOptimizer.generatePerformanceReport();
    
    // Display results
    console.log('📊 PERFORMANCE AUDIT REPORT');
    console.log('=' .repeat(50));
    console.log(`Timestamp: ${report.timestamp.toISOString()}`);
    console.log(`Performance Score: ${report.summary.performanceScore}/100`);
    console.log(`Critical Issues: ${report.summary.criticalIssues}`);
    console.log(`Total Recommendations: ${report.summary.recommendations}\n`);
    
    // Database Analysis
    console.log('🗄️  DATABASE ANALYSIS');
    console.log('-'.repeat(30));
    
    // Index Analysis
    console.log('\n📋 Current Indexes:');
    for (const [collection, data] of Object.entries(report.database.indexes)) {
      if (data.error) {
        console.log(`  ❌ ${collection}: ${data.error}`);
      } else {
        console.log(`  📁 ${collection}: ${data.indexes.length} indexes, ${data.stats.count} documents`);
        console.log(`     Storage: ${Math.round(data.stats.storageSize / 1024 / 1024 * 100) / 100}MB`);
        console.log(`     Index Size: ${Math.round(data.stats.totalIndexSize / 1024 / 1024 * 100) / 100}MB`);
      }
    }
    
    // Missing Indexes
    if (report.database.missingIndexes.length > 0) {
      console.log('\n⚠️  Missing Indexes:');
      report.database.missingIndexes.forEach((idx, i) => {
        const priority = idx.priority === 'high' ? '🔴' : idx.priority === 'medium' ? '🟡' : '🟢';
        console.log(`  ${priority} ${idx.collection}: ${Object.keys(idx.index).join(', ')}`);
        console.log(`     Reason: ${idx.reason}`);
      });
    } else {
      console.log('\n✅ All recommended indexes are present');
    }
    
    // Query Performance
    console.log('\n⚡ Query Performance:');
    const queryPerf = report.database.queryPerformance;
    console.log(`  Total Queries: ${queryPerf.totalQueries}`);
    console.log(`  Slow Queries: ${queryPerf.slowQueries}`);
    console.log(`  Average Execution Time: ${queryPerf.averageExecutionTime}ms`);
    
    if (Object.keys(queryPerf.queryBreakdown).length > 0) {
      console.log('\n  Query Breakdown:');
      Object.entries(queryPerf.queryBreakdown)
        .sort(([,a], [,b]) => b.avgTime - a.avgTime)
        .slice(0, 5)
        .forEach(([query, stats]) => {
          const status = stats.avgTime > 100 ? '🔴' : stats.avgTime > 50 ? '🟡' : '🟢';
          console.log(`    ${status} ${query}: ${stats.avgTime}ms avg (${stats.count} calls)`);
        });
    }
    
    // Request Deduplication
    console.log('\n🔄 REQUEST DEDUPLICATION');
    console.log('-'.repeat(30));
    if (report.requests.issues.length > 0) {
      console.log(`⚠️  Found ${report.requests.issues.length} potential duplicate request issues:`);
      report.requests.issues.forEach(issue => {
        console.log(`  • ${issue.queryKey}: ${issue.instances} instances within ${issue.timeDifference}ms`);
      });
      
      console.log('\n💡 Recommendations:');
      report.requests.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    } else {
      console.log('✅ No duplicate request issues detected');
    }
    
    // Image Optimization
    console.log('\n🖼️  IMAGE OPTIMIZATION');
    console.log('-'.repeat(30));
    if (report.images.recommendations.length > 0) {
      report.images.recommendations.forEach(rec => {
        console.log(`📋 ${rec.type.toUpperCase()}:`);
        if (rec.issue) {
          console.log(`  Issue: ${rec.issue}`);
        }
        console.log('  Suggestions:');
        rec.suggestions.forEach(suggestion => {
          console.log(`    • ${suggestion}`);
        });
        console.log('');
      });
    }
    
    // Auto-optimization prompt
    console.log('\n🚀 AUTO-OPTIMIZATION');
    console.log('-'.repeat(30));
    
    const highPriorityIndexes = report.database.missingIndexes.filter(idx => idx.priority === 'high');
    if (highPriorityIndexes.length > 0) {
      console.log(`Found ${highPriorityIndexes.length} high-priority missing indexes.`);
      
      // Check if --auto-fix flag is provided
      const autoFix = process.argv.includes('--auto-fix');
      
      if (autoFix) {
        console.log('🔧 Auto-fixing enabled. Creating missing indexes...');
        const results = await performanceOptimizer.autoOptimize({ createIndexes: true });
        
        console.log(`✅ Created ${results.indexesCreated.length} indexes`);
        results.indexesCreated.forEach(result => {
          console.log(`  • ${result.collection}: ${Object.keys(result.index).join(', ')}`);
        });
        
        if (results.errors.length > 0) {
          console.log(`❌ Errors: ${results.errors.length}`);
          results.errors.forEach(error => console.log(`  • ${error}`));
        }
      } else {
        console.log('💡 Run with --auto-fix to automatically create missing indexes');
        console.log('   Example: npm run audit:performance -- --auto-fix');
      }
    } else {
      console.log('✅ No high-priority optimizations needed');
    }
    
    // Summary and Score Interpretation
    console.log('\n📈 PERFORMANCE SCORE BREAKDOWN');
    console.log('-'.repeat(30));
    const score = report.summary.performanceScore;
    let scoreInterpretation = '';
    let scoreEmoji = '';
    
    if (score >= 90) {
      scoreEmoji = '🟢';
      scoreInterpretation = 'Excellent - Your API is well optimized';
    } else if (score >= 75) {
      scoreEmoji = '🟡';
      scoreInterpretation = 'Good - Minor optimizations recommended';
    } else if (score >= 60) {
      scoreEmoji = '🟠';
      scoreInterpretation = 'Fair - Several optimizations needed';
    } else {
      scoreEmoji = '🔴';
      scoreInterpretation = 'Poor - Significant optimizations required';
    }
    
    console.log(`${scoreEmoji} Score: ${score}/100 - ${scoreInterpretation}`);
    
    // Recommendations summary
    if (report.summary.recommendations > 0) {
      console.log('\n🎯 NEXT STEPS:');
      console.log('1. Create missing high-priority database indexes');
      console.log('2. Implement request deduplication middleware');
      console.log('3. Optimize image serving and compression');
      console.log('4. Monitor query performance regularly');
      console.log('5. Consider implementing caching layer');
    }
    
    console.log('\n✅ Performance audit completed!');
    
    // Save detailed report to file
    const fs = await import('fs/promises');
    const reportPath = `performance-audit-${Date.now()}.json`;
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Performance audit failed:', error);
    logger.error('Performance audit error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`
🔍 Performance Audit Tool

Usage: node performanceAudit.js [options]

Options:
  --auto-fix    Automatically create missing high-priority indexes
  --help, -h    Show this help message

Examples:
  node performanceAudit.js                    # Run audit only
  node performanceAudit.js --auto-fix         # Run audit and auto-fix issues
  
This tool analyzes your API's performance and provides recommendations for:
• Database indexing optimization
• Query performance analysis  
• Request deduplication issues
• Image serving optimization
• Overall performance scoring
`);
  process.exit(0);
}

// Run the audit
runPerformanceAudit();