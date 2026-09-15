import { access, mkdir, cp, copyFile, rm } from 'node:fs/promises';

await access('index.html');
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await copyFile('index.html', 'dist/index.html');
await cp('public', 'dist/public', { recursive: true });
await mkdir('dist/src/domain', { recursive: true });
await mkdir('dist/src/content', { recursive: true });
await copyFile('src/domain/phone.js', 'dist/src/domain/phone.js');
await copyFile('src/content/questions.js', 'dist/src/content/questions.js');
await cp('admin', 'dist/admin', { recursive: true });
console.log('Static application validated and copied to dist/.');
