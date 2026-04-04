const fs = require("fs");

// danh sách module cho sàn sách
const modules = [
  "authors",
  "books",
  "categories",
  "orders",
  "users",
  "customers",
  "inventory",
];

modules.forEach(createModule);

function createModule(moduleName) {
  const basePath = `src/app/admin/${moduleName}`;

  const folders = [
    `${basePath}/_components`,
    `${basePath}/new`,
    `${basePath}/[id]/edit`,
  ];

  // tạo folder
  folders.forEach((folder) => {
    fs.mkdirSync(folder, { recursive: true });
  });

  const ModuleName = capitalize(moduleName);

  // ===== COMPONENT =====
  fs.writeFileSync(
    `${basePath}/_components/${ModuleName}Form.tsx`,
    `export default function ${ModuleName}Form() {
  return <div>${ModuleName} Form</div>;
}`
  );

  // ===== NEW PAGE =====
  fs.writeFileSync(
    `${basePath}/new/page.tsx`,
    `export default function New${ModuleName}Page() {
  return <div>Create ${moduleName}</div>;
}`
  );

  // ===== EDIT PAGE =====
  fs.writeFileSync(
    `${basePath}/[id]/edit/page.tsx`,
    `export default function Edit${ModuleName}Page() {
  return <div>Edit ${moduleName}</div>;
}`
  );

  // ===== SERVICE =====
  fs.mkdirSync(`src/services`, { recursive: true });

  fs.writeFileSync(
    `src/services/${moduleName}Service.ts`,
    `export const ${moduleName}Service = {
  getAll: async () => {},
  getById: async (id: string) => {},
  create: async (data: any) => {},
  update: async (id: string, data: any) => {},
  delete: async (id: string) => {},
};
`
  );

  console.log(`✅ Created module: ${moduleName}`);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}