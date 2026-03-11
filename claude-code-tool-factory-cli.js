#!/usr/bin/env node

/**
 * Claude Code Tool Factory CLI - واجهة سطر الأوامر
 * لإدارة مصنع الأدوات الذكي
 */

const { ClaudeCodeToolFactory } = require('./claude-code-tool-factory');

// CLI arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  showHelp();
  process.exit(0);
}

const factory = new ClaudeCodeToolFactory();

const command = args[0];

switch (command) {
  case 'generate':
    handleGenerate(args);
    break;
  case 'batch':
    handleBatch(args);
    break;
  case 'list':
    handleList();
    break;
  case 'stats':
    handleStats();
    break;
  case 'templates':
    handleTemplates();
    break;
  case 'clean':
    handleClean();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    console.log(`⚠️  أمر غير معروف: ${command}`);
    showHelp();
    process.exit(1);
}

function showHelp() {
  console.log(`
⚙️  Claude Code Tool Factory CLI
==================================
`);
  console.log(`📝 الاستخدام:`);
  console.log(`  generate <spec.json>     توليد أداة من ملف مواصفات JSON`);
  console.log(`  batch <specs.json>       توليد أدوات متعددة من ملف`);
  console.log(`  list                     عرض الأدوات المتوفرة`);
  console.log(`  stats                    عرض إحصائيات المصنع`);
  console.log(`  templates                عرض القوالب المتاحة`);
  console.log(`  clean                    حذف الأدوات المتولدة`);
  console.log(`  help                     عرض هذا المساعدة`);
  
  console.log(`\n📋 مثال على استخدام generate:`);
  console.log(`  node claude-code-tool-factory-cli.js generate tool-spec.json`);
  console.log(`\n📋 مثال على استخدام batch:`);
  console.log(`  node claude-code-tool-factory-cli.js batch tools-batch.json`);
}

function handleGenerate(args) {
  if (args.length < 2) {
    console.log(`⚠️  مطلوب: generate <spec.json>`);
    return;
  }

  const specFile = args[1];
  
  if (!fs.existsSync(specFile)) {
    console.log(`❌ الملف غير موجود: ${specFile}`);
    return;
  }

  try {
    const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
    factory.generateTool(spec).then(result => {
      if (result.success) {
        console.log(`✅ تم توليد الأداة بنجاح!`);
        console.log(`   📁 المسار: ${result.skillPath}`);
      } else {
        console.log(`❌ فشل توليد الأداة: ${result.error}`);
      }
    });
  } catch (error) {
    console.log(`❌ خطأ في قراءة المواصفات: ${error.message}`);
  }
}

function handleBatch(args) {
  if (args.length < 2) {
    console.log(`⚠️  مطلوب: batch <specs.json>`);
    return;
  }

  const specsFile = args[1];
  
  if (!fs.existsSync(specsFile)) {
    console.log(`❌ الملف غير موجود: ${specsFile}`);
    return;
  }

  try {
    const specs = JSON.parse(fs.readFileSync(specsFile, 'utf8'));
    if (!Array.isArray(specs)) {
      console.log(`❌ الملف يجب أن يحتوي على مصفوفات JSON`);
      return;
    }

    factory.generateBatch(specs).then(results => {
      const successful = results.filter(r => r.success).length;
      console.log(`\n📊 نتائج التوليد المتعدد:`);
      console.log(`   ✅ نجح: ${successful}/${specs.length}`);
      console.log(`   ❌ فشل: ${specs.length - successful}/${specs.length}`);
    });
  } catch (error) {
    console.log(`❌ خطأ في قراءة المواصفات: ${error.message}`);
  }
}

function handleList() {
  const tools = factory.listTools();
  
  console.log(`\n📋 الأدوات المتوفرة (${tools.length}):`);
  
  tools.forEach((tool, index) => {
    console.log(`\n${index + 1}. ${tool.name}`);
    console.log(`   📊 نوع: ${tool.type}`);
    console.log(`   🔄 الحالة: ${tool.status}`);
    console.log(`   💰 الإيرادات: $${tool.revenueGenerated || 0}`);
    console.log(`   🔄 الاستخدام: ${tool.usageCount || 0}`);
    console.log(`   📁 المسار: ${tool.path}`);
  });
}

function handleStats() {
  const stats = factory.getStats();
  
  console.log(`\n📊 إحصائيات المصنع:`);
  console.log(`   🔄 إجمالي الأدوات: ${stats.totalTools}`);
  console.log(`   ✅ نشطة: ${stats.toolsCreated}`);
  console.log(`   💰 إيرادات محتملة: $${stats.revenueGenerated}/month`);
  console.log(`   ⏱️ وقت البناء: ${stats.avgBuildTime.toFixed(1)}ms`);
  console.log(`   📊 معرف نجاح: ${stats.successRate.toFixed(2)}%`);
  console.log(`   🔄 الأدوات النشطة: ${stats.activeTools}/${stats.totalTools}`);
  console.log(`   🔌 معرف المصنع: ${stats.factoryId}`);
}

function handleTemplates() {
  const templatesDir = path.join(factory.toolsDir, 'templates');
  
  if (!fs.existsSync(templatesDir)) {
    console.log(`❌ مجلد القوالب غير موجود`);
    return;
  }
  
  const templates = fs.readdirSync(templatesDir);
  
  console.log(`\n📁 القوالب المتاحة (${templates.length}):`);
  
  templates.forEach((template, index) => {
    console.log(`\n${index + 1}. ${template}`);
  });
}

function handleClean() {
  const toolsDir = path.join(factory.toolsDir, 'generated');
  
  if (fs.existsSync(toolsDir)) {
    // Delete all generated files
    const files = fs.readdirSync(toolsDir);
    files.forEach(file => {
      fs.unlinkSync(path.join(toolsDir, file));
    });
    fs.rmdirSync(toolsDir);
    
    console.log(`✅ تم حذف كل الأدوات المتولدة`);
  } else {
    console.log(`⚠️  لا توجد أدوات متولدة للحذف`);
  }
}