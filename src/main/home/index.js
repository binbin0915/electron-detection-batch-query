const {search} = require('./apis')
const cheerio = require('cheerio')

const {ipcMain, dialog} = require('electron');

// 保存全局数据
let state = {
  // 读取的excel数据
  excelData: {
    phoneArr: [], // 手机号码数组
    idNumArr: [] // 证件号数组
  },
  excelArr: [], // 准备导出的excel数据
  loginCookie: '' // 登录信息
}

// 将table的数据转成二维数组，解析出单元格数据
function tableToArr(table = '') {
  const $ = cheerio.load(table);
  const trs = $('#reportTable').find('tr')
  const headArr = []
  const dataArr = []

  // 遍历tr
  trs.map((i, tr) => {
    const ths = $(tr).find('th')
    // 获取表头
    if(ths) {
      ths.map((ith, th) => {
        headArr.push($(th).text())
      })
    }

    // 获取单元格数据
    const tds = $(tr).find('td')
    if(tds) {
      const tdArr = []
      tds.map((itd, td) => {
        tdArr.push($(td).text())
      })
      tdArr.length && dataArr.push(tdArr)
    }
  })
  // 返回表头数组和单元格数组的数据
  const res = {head: headArr, data: dataArr}
  return res
}

// 获取table的字符串
function getTableStr(str = '') {
  const $ = cheerio.load(str);
  $('#reportTable').attr('style', 'width: max-content;')
  $('#reportTable').attr('border', '1')
  $('#reportTable').attr('class', '')
  const res = $('div.panel-body-xscroll').html();
  // 获取table的字符串
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
    idNumArr.push(item[0])
    phoneArr.push(item[1])
  })
  idNumArr.shift() // 去除excel表头
  phoneArr.shift() // 去除excel表头
  return {phoneArr, idNumArr}
}

// 批量查询
async function batchQuery() {
  try {
    console.log('查询中，请稍候...')
    const {idNumArr, phoneArr} = state.excelData
    const tableHTMLArr = [] // table字符串数组
    const notResultArr = [] // 未查询到结果的数据
    // 循环查询结果，先查证件号，再查手机号，手机table字符串
    for(let i = 0; i < idNumArr.length; i++) {
      let res = await search({identityNumber: idNumArr[i], loginCookie: state.loginCookie})
      let tableHtml = getTableStr(res)

      const $ = cheerio.load(tableHtml);
      const tds = $('#reportTable').find('td')
      console.log('证件号查询结果为空，查手机号' + phoneArr[i])
      
      if(tds.length === 0) { // 证件号查询为空，查手机号
        const phoneNum = state.excelData.phoneArr[i]
        if (phoneNum) {
          res = await search({phoneNumber: phoneNum, loginCookie: state.loginCookie})
          tableHtml = getTableStr(res)
          const $ = cheerio.load(tableHtml);
          const tds = $('#reportTable').find('td')
          // 手机号码也没查到数据，将没有查到信息的数据保存起来，提示用户手动查询确认
          if(tds.length === 0) {
            notResultArr.push([idNumArr[i], phoneNum])
          }
        }
      }
      tableHTMLArr.push(tableHtml)
    }

    const excelArr = []
    // 遍历table字符串，解析出单元格数据
    tableHTMLArr.forEach((tableStr, i) => {
      const arrObj = tableToArr(tableStr) // 解析出单元格数据
      // 拼接表头数据
      if(i === 0) {
        excelArr.push([...arrObj.head])
      }

      // 拼接表的数据
      let data = arrObj.data || []
      data.forEach(item => {
        excelArr.push(item)
      })
    })
    // 返回excel二维数组和未查询到的信息
    return {excelArr, notResultArr}
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

// 重置全局状态
function resetState() {
  state = {
    excelData: {
      phoneArr: [],
      idNumArr: []
    },
    excelArr: [],
    loginCookie: ''
  }
}

function registerEvent() {
  // 监听 查询 消息
  ipcMain.handle('request:search', async () => {
    const res = await batchQuery()
    state.excelArr = res.excelArr
    state.notResultArr = res.notResultArr
    return res
  })

  // 监听 读取excel 消息
  ipcMain.handle('file:readExcel', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog()
    if (canceled) {
      resetState()
      return state.excelData
    } else {
      const path = filePaths[0]
      const excelData = readExcel(path)
      state.excelData = excelData
      return excelData
    }
  })

  // 监听 导出excel 消息
  ipcMain.on('file:exportExcel', async (event, val) => {
    return await writeExcel(val)
  })

  // 监听 登录cookie 消息
  ipcMain.on('login:cookie', async (event, val) => {
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