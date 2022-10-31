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
  exportExcel: async (val) => {
    return await ipcRenderer.send('file:exportExcel', val)
  },
  updateCookie: async (val) => {
    return ipcRenderer.send('login:cookie', val)
  }
})