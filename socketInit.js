const fs = require('fs');
const path = require('path');
// Import the required modules
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { exec } = require('child_process');

const {TerminalManager} = require('./terminal.js');
// Set up an Express application
const app = express();
const server = http.createServer(app);
function getDirToYourApp(str){
  const tempPath = path.dirname(str);
  const newPath = path.join(tempPath,"your-app");
  return newPath
}
let currentDir = getDirToYourApp(__dirname);
let currentDirForTerm = currentDir;

// Set up a Socket.IO server with the HTTP server
const io = new Server(server,{
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        credentials: true
      }
});

async function getSortedFilesAndDirs(folderPath) {
  try {
    const fullPath = path.join(currentDir, folderPath);
    //const fullPath = currentDir+folderPath;
      // Step 1: Read the contents of the directory
      const files  = await fs.readdirSync(fullPath);

      // Step 2: Map each file to an object with its stats
      const fileDetails = await Promise.all(files.map(async (file) => {
          const filePath = path.join(fullPath, file);
          const stats = await fs.statSync(filePath);
          return {
              name: file,
              isDirectory: stats.isDirectory(),
              creationTime: stats.birthtime, // creation time
              path : folderPath
          };
      }));

      // Step 3: Sort by isDirectory first, then by creation time
      fileDetails.sort((a, b) => {
          // Directories come before files
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          // Within same type (both dirs or both files), sort by creation time
          return a.creationTime - b.creationTime;
      });

      return fileDetails;
  } catch (error) {
      console.error("Error reading directory:", error);
  }
}


const newTerminal = new TerminalManager();

// Listen for connections
io.on('connection', (socket) => {
  const projectId = socket.handshake.headers.projectId;

  console.log('A client connected:', socket.id);
  //Terminal related events
  socket.emit("cwd",currentDirForTerm);

  ///--------terminal works

  newTerminal.createPty('1234', 'newreplid', (data, id) => {
    socket.emit('cmdOutput', data);
  });

socket.on("terminalData", async (data) => {
  newTerminal.write('1234', data);
});

  //-----------


  socket.on('commandToExec',(command)=>{

    newTerminal.write(socket.id, command);
  });




  //---
  // Listens root folder as well as child folders
  socket.on('getDir', (path) => {
    getSortedFilesAndDirs(path).then((result) => {
      console.log("Sorted Directory Contents:");
      console.table(result);
      socket.emit(`${path}`, result);
    });
    

  });

  socket.on("readFile", async (fileName)=>{
    const data =  fs.readFileSync(currentDir+fileName);
    socket.emit(fileName, data.toString());
  })

  // SAVE DATA IN FILE
  socket.on("writeInFile", async (data)=>{
    const path = data.path;
    if(path === null) return;
    const info = fs.writeFileSync(currentDir+data.path, data.content, { flag: 'w+' });
    console.log(info);
  })

  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.get("/health",(req,res)=>{
  res.send("hi running in 8000.");
})
// Start the server
const PORT = 8000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
