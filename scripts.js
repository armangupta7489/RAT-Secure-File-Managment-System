
const users = {
    admin: { password: "admin123", role: "admin", mfa: "123456", permissions: { read: true, write: true, delete: true } },
    user: { password: "user123", role: "user", mfa: "654321", permissions: { read: true, write: true, delete: true } }
};

let currentUser = null;
let operationLog = [];
let currentPath = "/";

function showMenu() {
    alert("Available Operations:\n- List Files\n- Create File\n- Create Directory\n- Delete File\n- Rename File\n- Edit File\n- Search File\n- View File\n- Sort Files\n- Copy File\n- Move File\n- Append to File\n- Check File Size\n- Check Last Modified\n- Clear File\n- Backup File\n- Search Content");
}

function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const mfaCode = document.getElementById("mfa-code").value.trim();
    const message = document.getElementById("auth-message");

    if (users[username] && users[username].password === password && users[username].mfa === mfaCode) {
        currentUser = username;
        document.getElementById("auth-section").style.display = "none";
        document.getElementById("file-section").style.display = "block";
        loadFiles();
        logOperation("login", username);
        message.textContent = "";
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
    currentPath = "/";
    document.getElementById("auth-section").style.display = "block";
    document.getElementById("file-section").style.display = "none";
    document.getElementById("auth-message").textContent = "";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("mfa-code").value = "";
}

function getPath(filename) {
    return currentPath === "/" ? `/${filename}` : `${currentPath}/${filename}`;
}

function uploadFile() {
    const fileInput = document.getElementById("file-input");
    const files = fileInput.files;

    for (let file of files) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            saveFile(getPath(file.name), content);
            logOperation("upload", file.name);
            loadFiles();
        };
        reader.readAsText(file);
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
        isDirectory: false
    };
    localStorage.setItem("files", JSON.stringify(files));
}

function createDirectory() {
    if (!users[currentUser].permissions.write) {
        alert("Permission denied");
        return;
    }
    const dirname = prompt("Enter directory name:");
    if (dirname) {
        const dirPath = getPath(dirname);
        let files = JSON.parse(localStorage.getItem("files") || "{}");
        if (files[dirPath]) {
            alert("Directory or file already exists");
            return;
        }
        files[dirPath] = {
            data: "",
            owner: currentUser,
            role: users[currentUser].role,
            permissions: users[currentUser].permissions,
            size: 0,
            lastModified: new Date().toISOString(),
            isDirectory: true
        };
        localStorage.setItem("files", JSON.stringify(files));
        logOperation("create_directory", dirPath);
        loadFiles();
    }
}

function goUp() {
    if (currentPath === "/") return;
    const pathParts = currentPath.split("/").filter(p => p);
    pathParts.pop();
    currentPath = pathParts.length ? "/" + pathParts.join("/") : "/";
    loadFiles();
}

function goHome() {
    currentPath = "/";
    loadFiles();
}

function enterDirectory(filename) {
    const dirPath = getPath(filename);
    const files = JSON.parse(localStorage.getItem("files") || "{}");
    if (files[dirPath] && files[dirPath].isDirectory) {
        currentPath = dirPath;
        loadFiles();
    } else {
        alert("Not a directory");
    }
}

function loadFiles() {
    const fileList = document.getElementById("file-list");
    const pathDisplay = document.getElementById("current-path");
    fileList.innerHTML = "";
    pathDisplay.textContent = `Current Path: ${currentPath}`;
    const files = JSON.parse(localStorage.getItem("files") || "{}");
    const pathPrefix = currentPath === "/" ? "/" : currentPath + "/";

    for (let filename in files) {
        if (filename.startsWith(pathPrefix) && filename !== currentPath &&
            filename.split("/").length === pathPrefix.split("/").length &&
            users[currentUser].permissions.read && (users[currentUser].role === "admin" || files[filename].owner === currentUser)) {
            const shortName = filename.split("/").pop();
            const fileItem = document.createElement("div");
            fileItem.className = `file-item ${files[filename].isDirectory ? 'directory' : ''}`;
            const buttons = files[filename].isDirectory
                ? `
                    <button class="open-btn" onclick="enterDirectory('${shortName}')">Open</button>
                    <button class="delete-btn" onclick="deleteFile('${filename}')">Delete</button>
                    <button class="rename-btn" onclick="renameFile('${filename}', '${shortName}')">Rename</button>
                `
                : `
                    <button class="view-btn" onclick="viewFile('${filename}')">View</button>
                    <button class="edit-btn" onclick="editFile('${filename}')">Edit</button>
                    <button class="download-btn" onclick="downloadFile('${filename}')">Download</button>
                    <button class="delete-btn" onclick="deleteFile('${filename}')">Delete</button>
                    <button class="rename-btn" onclick="renameFile('${filename}', '${shortName}')">Rename</button>
                    <button class="copy-btn" onclick="copyFile('${filename}', '${shortName}')">Copy</button>
                    <button class="move-btn" onclick="moveFile('${filename}', '${shortName}')">Move</button>
                    <button class="append-btn" onclick="appendToFile('${filename}')">Append</button>
                    <button class="size-btn" onclick="checkFileSize('${filename}')">Size</button>
                    <button class="modified-btn" onclick="checkLastModified('${filename}')">Modified</button>
                    <button class="clear-btn" onclick="clearFile('${filename}')">Clear</button>
                    <button class="backup-btn" onclick="backupFile('${filename}', '${shortName}')">Backup</button>
                    <button class="search-content-btn" onclick="searchContent('${filename}')">Search Content</button>
                `;
            fileItem.innerHTML = `
                <span>${files[filename].isDirectory ? '[DIR] ' : ''}${shortName}</span>
                <div>${buttons}</div>
            `;
            fileList.appendChild(fileItem);
        }
    }
}

function createFile() {
    if (!users[currentUser].permissions.write) {
        alert("Permission denied");
        return;
    }
    const filename = prompt("Enter new filename:");
    if (filename) {
        const filePath = getPath(filename);
        let files = JSON.parse(localStorage.getItem("files") || "{}");
        if (files[filePath]) {
            alert("File or directory already exists");
            return;
        }
        saveFile(filePath, "");
        logOperation("create_file", filePath);
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
        if (files[filename].isDirectory) {
            for (let f in files) {
                if (f.startsWith(filename + "/")) {
                    alert("Cannot delete non-empty directory");
                    return;
                }
            }
        }
        delete files[filename];
        localStorage.setItem("files", JSON.stringify(files));
        logOperation("delete_file", filename);
        loadFiles();
    }
}

function renameFile(filename, shortName) {
    if (!users[currentUser].permissions.write) {
        alert("Permission denied");
        return;
    }
    const newShortName = prompt("Enter new name:", shortName);
    if (newShortName && newShortName !== shortName) {
        let files = JSON.parse(localStorage.getItem("files") || "{}");
        const newFilename = filename.replace(shortName, newShortName);
        if (files[newFilename]) {
            alert("Name already exists");
            return;
        }
        files[newFilename] = files[filename];
        delete files[filename];
        if (files[newFilename].isDirectory) {
            const oldPrefix = filename + "/";
            const newPrefix = newFilename + "/";
            for (let f in files) {
                if (f.startsWith(oldPrefix)) {
                    const newF = newPrefix + f.substring(oldPrefix.length);
                    files[newF] = files[f];
                    delete files[f];
                }
            }
        }
        localStorage.setItem("files", JSON.stringify(files));
        logOperation("rename_file", `${filename} to ${newFilename}`);
        loadFiles();
    }
}

function editFile(filename) {
    if (!users[currentUser].permissions.write) {
        alert("Permission denied");
        return;
    }
    let files = JSON.parse(localStorage.getItem("files") || "{}");
    if (files[filename].isDirectory) {
        alert("Cannot edit a directory");
        return;
    }
    const content = files[filename].data;
    const newContent = prompt("Edit file content:", content);
    if (newContent !== null) {
        files[filename].data = newContent;
        files[filename].lastModified = new Date().toISOString();
        files[filename].size = newContent.length;
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
    const pathPrefix = currentPath === "/" ? "/" : currentPath + "/";

    for (let filename in files) {
        const shortName = filename.split("/").pop();
        if (shortName.toLowerCase().includes(searchTerm) && filename.startsWith(pathPrefix) &&
            filename.split("/").length === pathPrefix.split("/").length &&
            users[currentUser].permissions.read && (users[currentUser].role === "admin" || files[filename].owner === currentUser)) {
            const fileItem = document.createElement("div");
            fileItem.className = `file-item ${files[filename].isDirectory ? 'directory' : ''}`;
            const buttons = files[filename].isDirectory
                ? `
                    <button class="open-btn" onclick="enterDirectory('${shortName}')">Open</button>
                    <button class="delete-btn" onclick="deleteFile('${filename}')">Delete</button>
                    <button class="rename-btn" onclick="renameFile('${filename}', '${shortName}')">Rename</button>
                `
                : `
                    <button class="view-btn" onclick="viewFile('${filename}')">View</button>
                    <button class="edit-btn" onclick="editFile('${filename}')">Edit</button>
                    <button class="download-btn" onclick="downloadFile('${filename}')">Download</button>
                    <button class="delete-btn" onclick="deleteFile('${filename}')">Delete</button>
                    <button class="rename-btn" onclick="renameFile('${filename}', '${shortName}')">Rename</button>
                    <button class="copy-btn" onclick="copyFile('${filename}', '${shortName}')">Copy</button>
                    <button class="move-btn" onclick="moveFile('${filename}', '${shortName}')">Move</button>
                    <button class="append-btn" onclick="appendToFile('${filename}')">Append</button>
                    <button class="size-btn" onclick="checkFileSize('${filename}')">Size</button>
                    <button class="modified-btn" onclick="checkLastModified('${filename}')">Modified</button>
                    <button class="clear-btn" onclick="clearFile('${filename}')">Clear</button>
                    <button class="backup-btn" onclick="backupFile('${filename}', '${shortName}')">Backup</button>
                    <button class="search-content-btn" onclick="searchContent('${filename}')">Search Content</button>
                `;
            fileItem.innerHTML = `
                <span>${files[filename].isDirectory ? '[DIR] ' : ''}${shortName}</span>
                <div>${buttons}</div>
            `;
            fileList.appendChild(fileItem);
        }
    }
    logOperation("search_file", searchTerm);
}

function viewFile(filename) {
    const files = JSON.parse(localStorage.getItem("files") || "{}");
    if (files[filename].isDirectory) {
        alert("Cannot view a directory");
        return;
    }
    if (files[filename] && users[currentUser].permissions.read) {
        const content = files[filename].data;
        alert("File Content:\n" + content);
        logOperation("view_file", filename);
    }
}

function sortFiles() {
    const files = JSON.parse(localStorage.getItem("files") || "{}");
    const pathPrefix = currentPath === "/" ? "/" : currentPath + "/";
    const relevantFiles = Object.keys(files)
        .filter(f => f.startsWith(pathPrefix) && f.split("/").length === pathPrefix.split("/").length)
        .sort()
        .reduce((obj, key) => {
            obj[key] = files[key];
            return obj;
        }, {});
    const otherFiles = Object.keys(files)
        .filter(f => !f.startsWith(pathPrefix) || f.split("/").length !== pathPrefix.split("/").length)
        .reduce((obj, key) => {
            obj[key] = files[key];
            return obj;
        }, {});
    const sortedFiles = { ...otherFiles, ...relevantFiles };
    localStorage.setItem("files", JSON.stringify(sortedFiles));
    logOperation("sort_files", "");
    loadFiles();
}

function copyFile(filename, shortName) {
    if (!users[currentUser].permissions.write) {
        alert("Permission denied");
        return;
    }
    const files = JSON.parse(localStorage.getItem("files") || "{}");
    if (files[filename].isDirectory) {
        alert("Cannot copy a directory");
        return;
    }
    const newShortName = prompt("Enter new filename for copy:", `${shortName}_copy`);
    if (newShortName) {
        const newFilename = getPath(newShortName);
        if (files[newFilename]) {
            alert("Name already exists");
            return;
        }
        files[newFilename] = { ...files[filename], owner: currentUser };
        localStorage.setItem("files", JSON.stringify(files));
        logOperation("copy_file", `${filename} to ${newFilename}`);
        loadFiles();
    }
}

function moveFile(filename, shortName) {
    if (!users[currentUser].permissions.write) {
        alert("Permission denied");
        return;
    }
    const newShortName = prompt("Enter new filename for move:", shortName);
    if (newShortName && newShortName !== shortName) {
        let files = JSON.parse(localStorage.getItem("files") || "{}");
        const newFilename = getPath(newShortName);
        if (files[newFilename]) {
            alert("Name already exists");
            return;
        }
        files[newFilename] = files[filename];
        delete files[filename];
        localStorage.setItem("files", JSON.stringify(files));
        logOperation("move_file", `${filename} to ${newFilename}`);
        loadFiles();
    }
}

function appendToFile(filename) {
    if (!users[currentUser].permissions.write) {
        alert("Permission denied");
        return;
    }
    const files = JSON.parse(localStorage.getItem("files") || "{}");
    if (files[filename].isDirectory) {
        alert("Cannot append to a directory");
        return;
    }
    const content = prompt("Enter content to append:");
    if (content) {
        const currentContent = files[filename].data;
        const newContent = currentContent + content;
        files[filename].data = newContent;
        files[filename].lastModified = new Date().toISOString();
        files[filename].size = newContent.length;
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
    const files = JSON.parse(localStorage.getItem("files") || "{}");
    if (files[filename].isDirectory) {
        alert("Cannot clear a directory");
        return;
    }
    if (confirm("Are you sure you want to clear this file?")) {
        files[filename].data = "";
        files[filename].lastModified = new Date().toISOString();
        files[filename].size = 0;
        localStorage.setItem("files", JSON.stringify(files));
        logOperation("clear_file", filename);
        loadFiles();
    }
}

function backupFile(filename, shortName) {
    if (!users[currentUser].permissions.write) {
        alert("Permission denied");
        return;
    }
    let files = JSON.parse(localStorage.getItem("files") || "{}");
    if (files[filename].isDirectory) {
        alert("Cannot backup a directory");
        return;
    }
    const backupName = getPath(`${shortName}_backup_${new Date().toISOString().replace(/[:.]/g, '-')}`);
    files[backupName] = { ...files[filename], owner: currentUser };
    localStorage.setItem("files", JSON.stringify(files));
    logOperation("backup_file", filename);
    loadFiles();
}

function searchContent(filename) {
    const files = JSON.parse(localStorage.getItem("files") || "{}");
    if (files[filename].isDirectory) {
        alert("Cannot search content in a directory");
        return;
    }
    const searchTerm = prompt("Enter content to search:");
    if (searchTerm) {
        const content = files[filename].data;
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
    if (files[filename].isDirectory) {
        alert("Cannot download a directory");
        return;
    }
    if (files[filename] && users[currentUser].permissions.read) {
        const content = files[filename].data;
        const link = document.createElement("a");
        link.href = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
        link.download = filename.split("/").pop();
        link.click();
        logOperation("download_file", filename);
    }
}

// Apply button classes on page load
document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#auth-section button").classList.add("login-btn");
    document.querySelector(".file-upload button").classList.add("upload-btn");
    document.querySelectorAll(".file-operations button")[0].classList.add("search-btn");
    document.querySelectorAll(".file-operations button")[1].classList.add("menu-btn");
    document.querySelectorAll(".file-operations button")[2].classList.add("create-file-btn");
    document.querySelectorAll(".file-operations button")[3].classList.add("create-dir-btn");
    document.querySelectorAll(".file-operations button")[4].classList.add("go-up-btn");
    document.querySelectorAll(".file-operations button")[5].classList.add("go-home-btn");
    document.querySelectorAll(".file-operations button")[6].classList.add("sort-btn");
    document.querySelector(".file-actions button").classList.add("logout-btn");
});
