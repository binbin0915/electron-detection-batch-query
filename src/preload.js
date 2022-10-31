const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI',{
  search: async () => {
    return ipcRenderer.invoke('request:search')
  },
  testSearch: () => {
    return ipcRenderer.invoke('request:testSearch')
  },
  readExcel: async () => {
    return ipcRenderer.invoke('file:readExcel')
  },
  exportExcel: async () => {
    return ipcRenderer.invoke('file:exportExcel')
  },
  updateCookie: async (val) => {
    return ipcRenderer.send('login:cookie', val)
  }
})