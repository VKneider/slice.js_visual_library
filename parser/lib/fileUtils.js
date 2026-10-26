import fs from 'fs';

const writeFileIfChanged = (filePath, content) => {
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === content) {
    return false;
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return true;
};

const copyFileIfChanged = (sourcePath, targetPath) => {
  if (
    fs.existsSync(targetPath) &&
    fs.readFileSync(sourcePath).equals(fs.readFileSync(targetPath))
  ) {
    return false;
  }

  fs.copyFileSync(sourcePath, targetPath);
  return true;
};

export { writeFileIfChanged, copyFileIfChanged };
