const {search} = require('./apis')
const cheerio = require('cheerio')

console.log('main->home')
const {ipcMain, dialog} = require('electron');

let state = {
  excelData: {
    phoneArr: [],
    idNumArr: []
  },
  excelArr: [],
  loginCookie: ''
}

// 将table的数据转成二维数组
function tableToArr(table = '') {
  const $ = cheerio.load(table);
  const trs = $('#reportTable').find('tr')
  const headArr = []
  const dataArr = []

  trs.map((i, tr) => {
    const ths = $(tr).find('th')
    if(ths) {
      ths.map((ith, th) => {
        headArr.push($(th).text())
      })
    }

    const tds = $(tr).find('td')
    if(tds) {
      const tdArr = []
      tds.map((itd, td) => {
        tdArr.push($(td).text())
      })
      tdArr.length && dataArr.push(tdArr)
    }
  })
  const res = {head: headArr, data: dataArr}
  return res
}

// 处理html
function getTableStr(str = '') {
  const $ = cheerio.load(str);
  $('#reportTable').attr('style', 'width: max-content;')
  $('#reportTable').attr('border', '1')
  $('#reportTable').attr('class', '')
  const res = $('div.panel-body-xscroll').html();
  // console.log('getTableStr', res)

  return res;
}

// 读取excel
function readExcel(path = '') {
  const xlsx = require('node-xlsx')
  const sheet = xlsx.parse(path)
  const data = sheet[0].data
  const phoneArr = []
  const idNumArr = []
  data.forEach(item => {
    // console.log('data.item', item)
    // phoneArr.push(item[0])
    // idNumArr.push(item[1])
    idNumArr.push(item[0])
    phoneArr.push(item[1])
  })
  // phoneArr.shift()

  idNumArr.shift()
  phoneArr.shift()
  // console.log(phoneArr, idNumArr, data)
  return {phoneArr, idNumArr}
}

// 批量查询
async function batchQuery() {
  try {
    console.log('查询中，请稍候...')
    const {idNumArr, phoneArr} = state.excelData
    const tableHTMLArr = []
    for(let i = 0; i < idNumArr.length; i++) {
      let res = await search({identityNumber: idNumArr[i], loginCookie: state.loginCookie})
      // console.log('=================>search2 ', res)
      let tableHtml = getTableStr(res)

      // console.log('tableHtml=====================', tableHtml)

      const $ = cheerio.load(tableHtml);
      const tds = $('#reportTable').find('td')
      console.log('证件号查询结果为空，查手机号' + phoneArr[i])
      if(tds.length === 0) { // 证件号查询为空，查手机号
        const phoneNum = state.excelData.phoneArr[i]
        if (phoneNum) {
          res = await search({phoneNumber: phoneNum, loginCookie: state.loginCookie})
          tableHtml = getTableStr(res)
        }
      }
      tableHTMLArr.push(tableHtml)
    }

    const excelArr = []
    tableHTMLArr.forEach((tableStr, i) => {
      const arrObj = tableToArr(tableStr)
      if(i === 0) {
        excelArr.push([...arrObj.head])
      }

      const data = arrObj.data || []
      data.forEach(item => {
        excelArr.push(item)
      })
    })
    return excelArr
    // writeExcel(excelArr)
  } catch (error) {
    console.error('查询中失败，请重试', error)
  }
  console.log('查询完成，请查看file文件夹下的【查询结果.xlsx】文件')
}

// 将数据写入excel
function writeExcel(arr = []) {
  return new Promise((resolve, reject) => {
    try {
      const xlsx = require('node-xlsx').default;
      const sheetOptions = {'!cols': arr[0].map((item, index) => ({wch: index === 0 ? 10 : 20}))};
      const buffer = xlsx.build([{name: 'Sheet1', data: arr}], {sheetOptions});
      const fs = require('fs')
      const homedir = require('os').homedir();
      const output = homedir + '/Desktop/查询结果.xlsx'
      fs.writeFileSync(output, buffer)
      console.log('输出路径', output)
      resolve(1)
    } catch (error) {
      resolve(0)
    }
  })
}

function resetState() {
  state = {
    excelData: {
      phoneArr: [],
      idNumArr: []
    },
    excelArr: []
  }
}

function registerEvent() {
  console.log('============> registerEvent')
  ipcMain.handle('request:search', async () => {
    console.log('ipcMain search', state.excelData)
    const res = await batchQuery()
    state.excelArr = res
    // console.log('===========> ipcMain search', res)
    return res
  })

  ipcMain.handle('file:readExcel', async () => {
    console.log('ipcMain readExcel')
    const { canceled, filePaths } = await dialog.showOpenDialog()
    if (canceled) {
      resetState()
      return state.excelData
    } else {
      // return filePaths[0]
      const path = filePaths[0]
      console.log('path', path)
      const excelData = readExcel(path)
      console.log('excelData', excelData)
      state.excelData = excelData
      return excelData
    }
  })

  ipcMain.handle('file:exportExcel', async () => {
    console.log('ipcMain exportExcel')
    return await writeExcel(state.excelArr)
  })

  ipcMain.on('login:cookie', async (event, val) => {
    console.log('ipcMain login:cookie', val)
    state.loginCookie = val
  })

}

class MainHome {
  constructor() {
    registerEvent();
  }

  init() {
    console.log('MainHome inited')
  }
}

module.exports = {
  mainHome: new MainHome()
}