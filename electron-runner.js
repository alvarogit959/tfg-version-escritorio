const { spawn } = require('child_process');
const path = require('path');
const isDev = require('electron-is-dev');

const vueProcess = spawn('npm', ['run', 'serve'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

//await or it blows up
setTimeout(() => {
  const electronProcess = spawn('electron', ['.'], {
    cwd: path.join(__dirname, 'dist_electron'),
    stdio: 'inherit',
    shell: true
  });

  electronProcess.on('exit', () => {
    vueProcess.kill();
    process.exit();
  });
}, 5000);

vueProcess.on('exit', () => {
  process.exit();
});
