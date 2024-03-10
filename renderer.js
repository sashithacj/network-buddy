function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

window.electronAPI.receive('mostActiveProcess', (data) => {
    document.getElementById('name').innerHTML = data.name;
    if(data.cc){
        document.getElementById('remoteHost').innerHTML = `<img src="https://flagcdn.com/w20/${data.cc}.png" /> ${data.location} ${data.remoteHost}`;
    } else {
        document.getElementById('remoteHost').innerHTML = `${data.location} ${data.remoteHost}`;
    }
    document.getElementById('incomingBytes').innerHTML = formatBytes(data.incoming);
    document.getElementById('outgoingBytes').innerHTML = formatBytes(data.outgoing);
});