import re

file_path = r"d:\Java6\src\app\admin\categories\_components\CategoriesForm.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace first wrapper
content = re.sub(
    r'<div className="input-group">\s*<span className="input-group-text bg-light">\s*<i className="fa-solid fa-tag text-muted" />\s*</span>\s*<input',
    '<input',
    content
)

# Remove closing div for first wrapper
content = re.sub(
    r'disabled={loading}\s*/>\s*</div>\s*<FieldError msg=\{errors\.name\} />',
    'disabled={loading}\n                    />\n                  <FieldError msg={errors.name} />',
    content
)

# Replace second wrapper
content = re.sub(
    r'<div className="input-group">\s*<span className="input-group-text bg-light">\s*<i className="fa-solid fa-image text-muted" />\s*</span>\s*<input',
    '<input',
    content
)

# Remove closing div for second wrapper
content = re.sub(
    r'disabled={loading}\s*/>\s*</div>\s*<div className="form-text text-muted small mt-1">',
    'disabled={loading}\n                    />\n                  <div className="form-text text-muted small mt-1">',
    content
)

with open(file_path, "w", encoding="utf-8", newline='') as f:
    f.write(content)

print("Done replacing.")
