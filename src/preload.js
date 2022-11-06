const { contextBridge, ipcRenderer } = require('electron')

// 将electron的api挂载到window
contextBridge.exposeInMainWorld('electronAPI',{
  // 查询结果
  search: async () => {
    return ipcRenderer.invoke('request:search')
  },
  // 读取excel
  readExcel: async () => {
    return ipcRenderer.invoke('file:readExcel')
  },
  // 导出excel
  exportExcel: async (val) => {
    return await ipcRenderer.send('file:exportExcel', val)
  },
  // 更新cookie
  updateCookie: async (val) => {
    return ipcRenderer.send('login:cookie', val)
  }
})