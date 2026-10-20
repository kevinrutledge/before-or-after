import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Directories and files to skip
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".github",
  ".husky",
  "coverage",
  "dist",
  "build",
  "out",
  ".vercel",
  ".turbo",
  "test-results"
]);

const SKIP_FILES = new Set([
  ".DS_Store",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  ".gitignore",
  ".eslintcache",
  "codebase-export.txt"
]);

// File extensions to skip (binary and generated files)
const SKIP_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".ico",
  ".svg",
  ".pdf",
  ".zip",
  ".tar",
  ".gz",
  ".rar",
  ".mp4",
  ".avi",
  ".mov",
  ".mp3",
  ".wav",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".otf",
  ".exe",
  ".dll",
  ".so",
  ".dylib"
]);

// Additional files that create clutter (optional - uncomment to skip)
const CLUTTER_FILES = new Set([
  // ".env",
  // ".env.example",
  // ".prettierrc",
  // ".prettierignore",
  // "babel.config.cjs",
  // "jest.config.cjs",
  // "cypress.config.js",
  // ".last-run.json"
]);

// Check if file is likely text-based
function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return !SKIP_EXTENSIONS.has(ext);
}

// Check if file is too large (skip files over 1MB)
function isFileSizeReasonable(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size < 1024 * 1024; // 1MB
  } catch {
    return false;
  }
}

// Recursively get all files
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);

    if (fs.statSync(fullPath).isDirectory()) {
      if (!SKIP_DIRS.has(file)) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (
        !SKIP_FILES.has(file) &&
        !CLUTTER_FILES.has(file) &&
        isTextFile(fullPath) &&
        isFileSizeReasonable(fullPath)
      ) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

// Get file category for organization
function getFileCategory(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);

  if (relativePath.includes("test") || relativePath.includes("spec"))
    return "tests";
  if (relativePath.includes("docs/")) return "docs";
  if (relativePath.includes("/api/")) return "api";
  if (relativePath.includes("/components/")) return "components";
  if (relativePath.includes("/pages/")) return "pages";
  if (relativePath.includes("/hooks/")) return "hooks";
  if (relativePath.includes("/utils/")) return "utils";
  if (relativePath.includes("/models/")) return "models";
  if (relativePath.includes("/services/")) return "services";
  if (relativePath.includes("/routes/")) return "routes";
  if (relativePath.includes("cypress/")) return "e2e-tests";

  return "config";
}

// Main function
function exportCodebase() {
  const rootDir = process.cwd();
  const outputFile = "codebase-export.txt";

  console.log("Scanning codebase...");

  const files = getAllFiles(rootDir);
  console.log(`Found ${files.length} files to export\n`);

  // Group files by category
  const filesByCategory = {};
  files.forEach((file) => {
    const category = getFileCategory(file);
    if (!filesByCategory[category]) {
      filesByCategory[category] = [];
    }
    filesByCategory[category].push(file);
  });

  // Build output
  let output = `CODEBASE EXPORT\n`;
  output += `${"=".repeat(80)}\n`;
  output += `Generated: ${new Date().toISOString()}\n`;
  output += `Root: ${rootDir}\n`;
  output += `Total files: ${files.length}\n\n`;

  // Table of contents
  output += `TABLE OF CONTENTS\n`;
  output += `${"=".repeat(80)}\n\n`;

  Object.keys(filesByCategory)
    .sort()
    .forEach((category) => {
      const count = filesByCategory[category].length;
      output += `${category.toUpperCase()}: ${count} files\n`;
    });

  output += `\n${"=".repeat(80)}\n\n`;

  // Export files by category
  let processedCount = 0;
  const totalFiles = files.length;

  Object.keys(filesByCategory)
    .sort()
    .forEach((category) => {
      output += `\n\n${"#".repeat(80)}\n`;
      output += `# ${category.toUpperCase()}\n`;
      output += `${"#".repeat(80)}\n\n`;

      filesByCategory[category].forEach((filePath) => {
        const relativePath = path.relative(rootDir, filePath);

        try {
          const content = fs.readFileSync(filePath, "utf8");
          const lineCount = content.split("\n").length;

          output += `\n${"-".repeat(80)}\n`;
          output += `FILE: ${relativePath} (${lineCount} lines)\n`;
          output += `${"-".repeat(80)}\n\n`;
          output += content;
          output += `\n\n`;

          processedCount++;

          // Progress indicator (every 10 files)
          if (processedCount % 10 === 0) {
            process.stdout.write(
              `\rProcessed ${processedCount}/${totalFiles} files...`
            );
          }
        } catch (err) {
          console.log(`\nSkipped (read error): ${relativePath}`);
        }
      });
    });

  fs.writeFileSync(outputFile, output, "utf8");

  const fileSizeMB = (fs.statSync(outputFile).size / 1024 / 1024).toFixed(2);

  console.log(`\n\nExport complete!`);
  console.log(`Output: ${outputFile}`);
  console.log(`Size: ${fileSizeMB} MB`);
  console.log(`Files exported: ${processedCount}`);
}

// Run the export
exportCodebase();
