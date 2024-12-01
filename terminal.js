const { fork } = require('node-pty');

const path = require('path');
const os = require('os');

const SHELL = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
// Define the path to your sibling directory "your-app"
const cwdPath = path.join(__dirname, '..', 'your-app'); // Use relative path to reach "/your-app"
class TerminalManager {
    sessions = {};
    constructor() {
        this.sessions = {};
    }
    
    createPty(id, replId, onData) {
        let term = fork(SHELL, [], {
            cols: 100,
            name: 'xterm',
            cwd: cwdPath
        });
    
        term.on('data', (data) => {
            console.log(data);
            onData(data, term.pid)
        });
        this.sessions[id] = {
            terminal: term,
            replId
        };
        term.on('exit', () => {
            delete this.sessions[term.pid];
        });
        return term;
    }

    write(terminalId, data) {
        this.sessions[terminalId]?.terminal.write(data);
    }

    clear(terminalId) {
        this.sessions[terminalId].terminal.kill();
        delete this.sessions[terminalId];
    }
}

module.exports = {TerminalManager};
