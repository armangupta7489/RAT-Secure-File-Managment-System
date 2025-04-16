const users = {
    admin: { password: "admin123", role: "admin", mfa: "123456", permissions: { read: true, write: true, delete: true } },
    user: { password: "user123", role: "user", mfa: "654321", permissions: { read: true, write: true, delete: true } }
};

let currentUser = null;
let operationLog = [];
const AES_KEY = "xai-secure-file-system-256-bit-key-12345"; // 32 bytes for AES-256

function showMenu() {
    alert("Available Operations:\n- List Files\n- Create File\n- Delete File\n- Rename File\n- Edit File\n- Search File\n- View File\n- Sort Files\n- Copy File\n- Move File\n- Append to File\n- Check File Size\n- Check Last Modified\n- Clear File\n- Encrypt File\n- Decrypt File\n- Compress File\n- Decompress File\n- Change Permissions\n- Backup File\n- Search Content");
}

function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const mfaCode = document.getElementById("mfa-code").value;
    const message = document.getElementById("auth-message");

    if (users[username] && users[username].password === password && users[username].mfa === mfaCode) {
        currentUser = username;
        document.getElementById("auth-section").style.display = "none";
        document.getElementById("file-section").style.display = "block";
        loadFiles();
        logOperation("login", username);
    } else {
        message.textContent = "Invalid credentials or MFA code";
    }
}

function logOperation(operation, filename) {
    operationLog.push({ operation, filename, timestamp: new Date().toISOString() });
    localStorage.setItem("operationLog", JSON.stringify(operationLog));
}

function logout() {
    logOperation("logout", currentUser);
    currentUser = null;
    document.getElementById("auth-section").style.display = "block";
    document.getElementById("file-section").style.display = "none";
    document.getElementById("auth-message").textContent = "";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("mfa-code").value = "";
}

function uploadFile() {
    const fileInput = document.getElementById("file-input");
    const files = fileInput.files;

    for (let file of files) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const encryptedData = encryptData(e.target.result);
            saveFile(file.name, encryptedData);
            logOperation("upload", file.name);
            loadFiles();
        };
        reader.readAsText(file);
    }
}

function encryptData(data) {
    return CryptoJS.AES.encrypt(data, AES_KEY).toString();
}

function decryptData(data) {
    try {
        const bytes = CryptoJS.AES.decrypt(data, AES_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        return "";
    }
}

function compressData(data) {
    return pako.gzip(data, { to: 'string' });
}

function decompressData(data) {
    try {
        return pako.ungzip(data, { to: 'string' });
    } catch (e) {
        return data;
    }
}

function saveFile(filename, data) {
    let files = JSON.parse(localStorage.getItem("files") || "{}");
    files[filename] = {
        data,
        owner: currentUser,
        role: users[currentUser].role,
        permissions: users[currentUser].permissions,
        size: data.length,
        lastModified: new Date().toISOString(),
        isEncrypted: true,
        isCompressed: false
    };
    localStorage.setItem("files", JSON.stringify(files));
}

function loadFiles() {
    const fileList = document.getElementById("file-list");
    fileList.innerHTML = "";
    const files = JSON.parse(localStorage.getItem("files") || "{}");

    for (let filename in files) {
        if (users[currentUser].permissions.read && (users[currentUser].role === "admin" || files[filename].owner === currentUser)) {
            const fileItem = document.createElement("div");
            fileItem.className = "file-item";
            fileItem.innerHTML = `
                <span>${filename}</span>
                <div>
                    <button onclick="viewFile('${filename}')">View</button>
                    <button onclick="editFile('${filename}')">Edit</button>
                    <button onclick="downloadFile('${filename}')">Download</button>
                    <button onclick="deleteFile('${filename}')">Delete</button>
                    <button onclick="renameFile('${filename}')">Rename</button>
                    <button onclick="copyFile('${filename}')">Copy</button>
                    <button onclick="moveFile('${filename}')">Move</button>
                    <button onclick="appendToFile('${filename}')">Append</button>
                    <button onclick="checkFileSize('${filename}')">Size</button>
                    <button onclick="checkLastModified('${filename}')">Modified</button>
                    <button onclick="clearFile('${filename}')">Clear</button>
                    
                    <button onclick="compressFile('${filename}')">Compress</button>
                    <button onclick="decompressFile('${filename}')">Decompress</button>
                    
                    <button onclick="backupFile('${filename}')">Backup</button>
                    <button onclick="searchContent('${filename}')">Search Content</button>
                </div>
            `;
            fileList.appendChild(fileItem);
        }
    }
}

function listFiles() {
    loadFiles();
    logOperation("list_files", "");
}

function createFile() {
    if (!users[currentUser].permissions.write) {
        alert("Permission denied");
        return;
    }
    const filename = prompt("Enter new filename:");
    if (filename) {
        saveFile(filename, encryptData(""));
        logOperation("create_file", filename);
        loadFiles();
    }
}

function deleteFile(filename) {
    if (!users[currentUser].permissions.delete) {
        alert("Permission denied");
        return;
    }
    let files = JSON.parse(localStorage.getItem("files") || "{}");
    if (files[filename] && (users[currentUser].role === "admin" || files[filename].owner === currentUser)) {
        delete files[filename];
        localStorage.setItem("files", JSON.stringify(files));
        logOperation("delete_file", filename);
        loadFiles();
    }
}

function renameFile(filename) {
    if (!users[currentUser].permissions.write) {
        alert("Permission denied");
        return;
    }
    const newName = prompt("Enter new filename:", filename);
    if (newName && newName !== filename) {
        let files = JSON.parse(localStorage.getItem("files") || "{}");
        files[newName] = files[filename];
        delete files[filename];
        localStorage.setItem("files", JSON.stringify(files));
        logOperation("rename_file", `${filename} to ${newName}`);
        loadFiles();
    }
}

function editFile(filename) {
    if (!users[currentUser].permissions.write) {
        alert("Permission denied");
        return;
    }
    let files = JSON.parse(localStorage.getItem("files") || "{}");
    const content = prompt("Edit file content:", files[filename].isEncrypted ? decryptData(files[filename].data) : files[filename].data);
    if (content !== null) {
        files[filename].data = files[filename].isEncrypted ? encryptData(content) : content;
        files[filename].lastModified = new Date().toISOString();
        localStorage.setItem("files", JSON.stringify(files));
        logOperation("edit_file", filename);
        loadFiles();
    }
}

function searchFile() {
    const searchTerm = document.getElementById("search-input").value.toLowerCase();
    const fileList = document.getElementById("file-list");
    fileList.innerHTML = "";
    const files = JSON.parse(localStorage.getItem("files") || "{}");

    for (let filename in files) {
        if (filename.toLowerCase().includes(searchTerm) && users[currentUser].permissions.read &&
            (users[currentUser].role === "admin" || files[filename].owner === currentUser)) {
            const fileItem = document.createElement("div");
            fileItem.className = "file-item";
            fileItem.innerHTML = `
                <span>${filename}</span>
                <div>
                    <button onclick="viewFile('${filename}')">View</button>
                    <button onclick="editFile('${filename}')">Edit</button>
                    <button onclick="downloadFile('${filename}')">Download</button>
                    <button onclick="deleteFile('${filename}')">Delete</button>
                </div>
            `;
            fileList.appendChild(fileItem);
        }
    }
    logOperation("search_file", searchTerm);
}

function viewFile(filename) {
    const files = JSON.parse(localStorage.getItem("files") || "{}");
    if (files[filename] && users[currentUser].permissions.read) {
        const content = files[filename].isEncrypted ? decryptData(files[filename].data) : files[filename].data;
        alert("File Content:\n" + content);
        logOperation("view_file", filename);
    }
}

function sortFiles() {
    const files = JSON.parse(localStorage.getItem("files") || "{}");
    const sortedFiles = Object.keys(files).sort().reduce((obj, key) => {
        obj[key] = files[key];
        return obj;
    }, {});
    localStorage.setItem("files", JSON.stringify(sortedFiles));
    logOperation("sort_files", "");
    loadFiles();
}

function copyFile(filename) {
    if (!users[currentUser].permissions.write) {
        alert("Permission denied");
        return;
    }
    const newName = prompt("Enter new filename for copy:", `${filename}_copy`);
    if (newName) {
        let files = JSON.parse(localStorage.getItem("files") || "{}");
        files[newName] = { ...files[filename], owner: currentUser };
        localStorage.setItem("files", JSON.stringify(files));
        logOperation("copy_file", `${filename} to ${newName}`);
        loadFiles();
    }
}

function moveFile(filename) {
    if (!users[currentUser].permissions.write) {
        alert("Permission denied");
        return;
    }
    const newName = prompt("Enter new filename for move:", filename);
    if (newName && newName !== filename) {
        let files = JSON.parse(localStorage.getItem("files") || "{}");
        files[newName] = files[filename];
        delete files[filename];
        localStorage.setItem("files", JSON.stringify(files));
        logOperation("move_file", `${filename} to ${newName}`);
        loadFiles();
    }
}

function appendToFile(filename) {
    if (!users[currentUser].permissions.write) {
        alert("Permission denied");
        return;
    }
    const content = prompt("Enter content to append:");
    if (content) {
        let files = JSON.parse(localStorage.getItem("files") || "{}");
        const currentContent = files[filename].isEncrypted ? decryptData(files[filename].data) : files[filename].data;
        files[filename].data = files[filename].isEncrypted ? encryptData(currentContent + content) : currentContent + content;
        files[filename].lastModified = new Date().toISOString();
        localStorage.setItem("files", JSON.stringify(files));
        logOperation("append_file", filename);
        loadFiles();
    }
}

function checkFileSize(filename) {
    const files = JSON.parse(localStorage.getItem("files") || "{}");
    if (files[filename]) {
        alert(`File Size: ${files[filename].size} bytes`);
        logOperation("check_size", filename);
    }
}

function checkLastModified(filename) {
    const files = JSON.parse(localStorage.getItem("files") || "{}");
    if (files[filename]) {
        alert(`Last Modified: ${files[filename].lastModified}`);
        logOperation("check_modified", filename);
    }
}

function clearFile(filename) {
    if (!users[currentUser].permissions.write) {
        alert("Permission denied");
        return;
    }
    if (confirm("Are you sure you want to clear this file?")) {
        let files = JSON.parse(localStorage.getItem("files") || "{}");
        files[filename].data = files[filename].isEncrypted ? encryptData("") : "";
        files[filename].lastModified = new Date().toISOString();
        localStorage.setItem("files", JSON.stringify(files));
        logOperation("clear_file", filename);
        loadFiles();
    }
}

function encryptFile(filename) {
    let files = JSON.parse(localStorage.getItem("files") || "{}");
    if (files[filename] && !files[filename].isEncrypted) {
        files[filename].data = encryptData(decryptData(files[filename].data) || files[filename].data);
        files[filename].isEncrypted = true;
        localStorage.setItem("files", JSON.stringify(files));
        logOperation("encrypt_file", filename);
        alert("File encrypted");
        loadFiles();
    } else {
        alert("File already encrypted or invalid");
    }
}

function decryptFile(filename) {
    let files = JSON.parse(localStorage.getItem("files") || "{}");
    if (files[filename] && files[filename].isEncrypted) {
        const decrypted = decryptData(files[filename].data);
        if (decrypted) {
            files[filename].data = decrypted;
            files[filename].isEncrypted = false;
            localStorage.setItem("files", JSON.stringify(files));
            logOperation("decrypt_file", filename);
            alert("File decrypted");
            loadFiles();
        } else {
            alert("Decryption failed");
        }
    } else {
        alert("File not encrypted or invalid");
    }
}

function compressFile(filename) {
    let files = JSON.parse(localStorage.getItem("files") || "{}");
    if (files[filename] && !files[filename].isCompressed) {
        const content = files[filename].isEncrypted ? decryptData(files[filename].data) : files[filename].data;
        files[filename].data = files[filename].isEncrypted ? encryptData(compressData(content)) : compressData(content);
        files[filename].isCompressed = true;
        files[filename].size = files[filename].data.length;
        localStorage.setItem("files", JSON.stringify(files));
        logOperation("compress_file", filename);
        alert("File compressed");
        loadFiles();
    } else {
        alert("File already compressed or invalid");
    }
}

function decompressFile(filename) {
    let files = JSON.parse(localStorage.getItem("files") || "{}");
    if (files[filename] && files[filename].isCompressed) {
        const content = files[filename].isEncrypted ? decryptData(files[filename].data) : files[filename].data;
        const decompressed = decompressData(content);
        files[filename].data = files[filename].isEncrypted ? encryptData(decompressed) : decompressed;
        files[filename].isCompressed = false;
        files[filename].size = files[filename].data.length;
        localStorage.setItem("files", JSON.stringify(files));
        logOperation("decompress_file", filename);
        alert("File decompressed");
        loadFiles();
    } else {
        alert("File not compressed or invalid");
    }
}

/*function changePermissions(filename) {
    if (users[currentUser].role !== "admin") {
        alert("Permission denied");
        return;
    }
    const read = confirm("Allow read?");
    const write = confirm("Allow write?");
    const del = confirm("Allow delete?");
    let files = JSON.parse(localStorage.getItem("files") || "{}");
    files[filename].permissions = { read, write, delete: del };
    localStorage.setItem("files", JSON.stringify(files));
    logOperation("change_permissions", filename);
    loadFiles();
}*/

function backupFile(filename) {
    if (!users[currentUser].permissions.write) {
        alert("Permission denied");
        return;
    }
    let files = JSON.parse(localStorage.getItem("files") || "{}");
    const backupName = `${filename}_backup_${new Date().toISOString()}`;
    files[backupName] = { ...files[filename], owner: currentUser };
    localStorage.setItem("files", JSON.stringify(files));
    logOperation("backup_file", filename);
    loadFiles();
}

function searchContent(filename) {
    const searchTerm = prompt("Enter content to search:");
    if (searchTerm) {
        const files = JSON.parse(localStorage.getItem("files") || "{}");
        const content = files[filename].isEncrypted ? decryptData(files[filename].data) : files[filename].data;
        if (content.includes(searchTerm)) {
            alert(`Found "${searchTerm}" in ${filename}`);
        } else {
            alert(`"${searchTerm}" not found in ${filename}`);
        }
        logOperation("search_content", filename);
    }
}

function downloadFile(filename) {
    const files = JSON.parse(localStorage.getItem("files") || "{}");
    if (files[filename] && users[currentUser].permissions.read) {
        const content = files[filename].isEncrypted ? decryptData(files[filename].data) : files[filename].data;
        const finalContent = files[filename].isCompressed ? decompressData(content) : content;
        const link = document.createElement("a");
        link.href = "data:text/plain;charset=utf-8," + encodeURIComponent(finalContent);
        link.download = filename;
        link.click();
        logOperation("download_file", filename);
    }
}
