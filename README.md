# 背景
为什么做这个一键批量查询核酸的项目，我简单介绍下背景。
周六中午（10.26），我大学同学，拨通了我的微信电话，说在他老家那边做防疫工作，要做查询人员近期做核酸的情况，然后问我有没有批量查询的方法。然后他说他们是在政府的网站上查询的，每次只能查一个人的信息，然后又几万个人的信息要查，我说我研究一下，然后自己写了个批量查询的脚本，但是运行脚本需要在他那边电脑上安装运行环境，后来我就用electron开发了个桌面应用给他用，周末两天开发好了，立即给他用上了。
# 需求
我自己写了个简单的脚本，可以做到批量查询，然后跟他沟通了具体的需求，整体如下

1. 批量查询核酸结果
   1. 读取excel表格批量查询
   2. 根据身份证号查询，身份证没有查到再查手机号
2. 查询结果去重
3. 查询结果筛选，只展示姓名，身份证，手机号和采样时间
4. 将查询结果导出到excel
5. 罗列展示未查询到信息的身份证，手机
# 技术方案

网站的核酸接口有跨域的限制，无法通过自己实现的前端发起请求，所以通过node发请求，该接口返回的是html的文本，需解析请求的结果，再将结果写进excel表格，批量查询通过读取excel的数据，循环调用查询接口，整个过程类似于爬虫。
整合electron，electron包含了node和chromium，正好通过node的发起请求，将结果传给视图层展示。

![](https://cdn.nlark.com/yuque/0/2022/jpeg/743297/1667705226683-c2e36508-1107-4a7c-a22d-e9ba4e077fc1.jpeg)

## 项目技术

- electron
- wepack
- react
- node.js
- cheerio
- axios
- node-xlsx

# 项目开发
## 研究核酸查询接口
### 进入查询页面
首先需要登录：[https://hsjc.gdwst.gov.cn/ncov-nat/login](https://hsjc.gdwst.gov.cn/ncov-nat/login)
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667707660455-4902813f-2b82-438a-9505-b2e123858e85.png#averageHue=%230a94fa&clientId=u4b3c4be5-dd15-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=704&id=u8372e870&margin=%5Bobject%20Object%5D&name=image.png&originHeight=704&originWidth=1136&originalType=binary&ratio=1&rotation=0&showTitle=false&size=479746&status=done&style=none&taskId=u7afdc0d0-ee68-4402-a0ac-0d9c500a6b8&title=&width=1136)
登录成功后，进入综合查询->个案查询
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667707793847-97af83cf-79c9-4aba-9ed0-33b020871bce.png#averageHue=%23eff2d2&clientId=u4b3c4be5-dd15-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=829&id=u84c9d0f3&margin=%5Bobject%20Object%5D&name=image.png&originHeight=829&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&size=104891&status=done&style=none&taskId=u2bea9e7c-3a69-4cec-9667-3453b93f264&title=&width=1920)

![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667724456867-b5f93a5d-bd90-415e-9eb9-ff69296b6c80.png#averageHue=%23fcfcfc&clientId=u1622fdfa-290b-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=250&id=u2a95f525&margin=%5Bobject%20Object%5D&name=image.png&originHeight=250&originWidth=1319&originalType=binary&ratio=1&rotation=0&showTitle=false&size=15998&status=done&style=none&taskId=u011665f3-0afc-4e0e-9e0e-a772d964fda&title=&width=1319)
可以看到，这里只能单个查询，但是我们有几万要查询，手动复制粘贴查询，也很累。
### 查看接口信息
我们先输入个身份证，查询看看情况，然后在开发者工具中找到这个接口
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667724512207-f5fc9ba3-e105-48d9-94f6-72c8c18e3859.png#averageHue=%23e5d4c2&clientId=u1622fdfa-290b-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=847&id=u68e1ac53&margin=%5Bobject%20Object%5D&name=image.png&originHeight=847&originWidth=1418&originalType=binary&ratio=1&rotation=0&showTitle=false&size=277661&status=done&style=none&taskId=u52441fa7-1659-4584-ae73-9ce77d54bdd&title=&width=1418)
可以看到这个接口返回的数据是html
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667707979702-6116db56-5cfc-42c5-8b23-6e870a247aef.png#averageHue=%23fcf67e&clientId=u4b3c4be5-dd15-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=547&id=u2be204cd&margin=%5Bobject%20Object%5D&name=image.png&originHeight=547&originWidth=1914&originalType=binary&ratio=1&rotation=0&showTitle=false&size=96932&status=done&style=none&taskId=ubb4644d4-aecf-402d-857c-f23fa1bf290&title=&width=1914)

我们可以自己写个前端页面发起请求试试，这里我试了下，如果前端直接请求这个接口的话，会有跨域问题
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667721333025-50050a00-aae0-43b0-ba4b-a9f02ee86544.png#averageHue=%23fcf6f6&clientId=u1622fdfa-290b-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=371&id=u3feddac5&margin=%5Bobject%20Object%5D&name=image.png&originHeight=371&originWidth=1911&originalType=binary&ratio=1&rotation=0&showTitle=false&size=50254&status=done&style=none&taskId=uf813d18d-7b79-4eb5-a456-9a8960a02e2&title=&width=1911)
```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>

<body>
  <script>
    fetch("https://hsjc.gdwst.gov.cn/ncov-nat/nat/sample-detection-detail-query/personal-list-query", {
      "headers": {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
        "cache-control": "max-age=0",
        "content-type": "application/x-www-form-urlencoded",
        "sec-ch-ua": "\" Not;A Brand\";v=\"99\", \"Google Chrome\";v=\"91\", \"Chromium\";v=\"91\"",
        "sec-ch-ua-mobile": "?0",
        "sec-fetch-dest": "iframe",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "cookie": "NCOVNATSESSIONID=ZjFhNzU0ZTAtMzVhMS00NDI5LWI3NzUtMmNhNTVhNTU5OGEw"
      },
      "referrer": "https://hsjc.gdwst.gov.cn/ncov-nat/nat/sample-detection-detail-query/personal-list",
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": "selectScope=2&sampleBarcode=&personName=&identityNumber=441702xxxxxxxx1765&phoneNumber=&sampleDateBegin=&sampleDateEnd=&detectionDateBegin=&detectionDateEnd=",
      "method": "POST",
      "mode": "cors"
    }).then(res => {
      console.log(res)
    }).catch(err => {
      console.error(err)
    })
    
  </script>
</body>

</html>
```
所以，只能通过服务端发起网络请求去获取数据。

再看接口信息，在接口中可以找到cookie保存的登录信息，这个东西后面也会用到，每次发请求都得带上这个cookie，如果cookie过期，则需要重新登录。
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667708108426-087c7404-c170-49a7-ae80-d7b6f72a520c.png#averageHue=%23f9f7f6&clientId=u4b3c4be5-dd15-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=759&id=u02a77945&margin=%5Bobject%20Object%5D&name=image.png&originHeight=759&originWidth=1602&originalType=binary&ratio=1&rotation=0&showTitle=false&size=122685&status=done&style=none&taskId=u347c5bdf-2817-49df-9c9b-e80e0a1b880&title=&width=1602)

右键点击接口，把请求复制下来
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667708378518-7dc07deb-24b0-4c42-98cb-332c84816249.png#averageHue=%23f7f7f6&clientId=u4b3c4be5-dd15-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=408&id=uedf09697&margin=%5Bobject%20Object%5D&name=image.png&originHeight=408&originWidth=824&originalType=binary&ratio=1&rotation=0&showTitle=false&size=51999&status=done&style=none&taskId=u2641156c-6849-4bba-bfc7-a87aa7846a7&title=&width=824)

导入到postman中请求试试
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667708484791-8488bb3d-ac04-490e-ad26-d2f2c5a9c027.png#averageHue=%23ccc9c7&clientId=u4b3c4be5-dd15-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=214&id=u55747a31&margin=%5Bobject%20Object%5D&name=image.png&originHeight=214&originWidth=538&originalType=binary&ratio=1&rotation=0&showTitle=false&size=15059&status=done&style=none&taskId=u8c69031c-5f8c-4b1f-b26a-22e4808dd62&title=&width=538)
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667708631518-bc189cbe-60f5-4681-b12e-8200bcb05899.png#averageHue=%23e9e7e6&clientId=u4b3c4be5-dd15-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=670&id=uf078c86d&margin=%5Bobject%20Object%5D&name=image.png&originHeight=670&originWidth=1076&originalType=binary&ratio=1&rotation=0&showTitle=false&size=62790&status=done&style=none&taskId=u4f209bda-6252-43a5-850a-f85af95518d&title=&width=1076)
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667708653308-cf2bc196-339b-47b0-b963-99c481c86d4e.png#averageHue=%23e9e8e8&clientId=u4b3c4be5-dd15-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=664&id=u8d45d187&margin=%5Bobject%20Object%5D&name=image.png&originHeight=664&originWidth=1106&originalType=binary&ratio=1&rotation=0&showTitle=false&size=29764&status=done&style=none&taskId=u06766938-c543-44f4-a6c7-b556e4ef446&title=&width=1106)
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667708745561-7defd1d8-5ca4-4aff-88f1-356ba3c42a52.png#averageHue=%23fcfbfb&clientId=u4b3c4be5-dd15-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=861&id=u9cb93267&margin=%5Bobject%20Object%5D&name=image.png&originHeight=861&originWidth=1511&originalType=binary&ratio=1&rotation=0&showTitle=false&size=86136&status=done&style=none&taskId=u8d8a36f7-3368-4ee1-be7b-c1cfbe2261c&title=&width=1511)
点右边code，可以复制请求代码
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667708774291-5db03994-a24e-4779-8479-42f6b42508b0.png#averageHue=%23fbfbfa&clientId=u4b3c4be5-dd15-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=429&id=ua10c67cc&margin=%5Bobject%20Object%5D&name=image.png&originHeight=429&originWidth=1562&originalType=binary&ratio=1&rotation=0&showTitle=false&size=40225&status=done&style=none&taskId=ua8559609-7da4-40b5-b63c-f941a63874a&title=&width=1562)
然后选择Nodejs-Axios，复制请求代码，保存起来，后面electron发请求时直接使用这一段代码
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667708868797-7536d9d0-58ca-41f8-82ec-f6d7ebb0e207.png#averageHue=%23edecec&clientId=u4b3c4be5-dd15-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=654&id=u647507ce&margin=%5Bobject%20Object%5D&name=image.png&originHeight=654&originWidth=1069&originalType=binary&ratio=1&rotation=0&showTitle=false&size=82434&status=done&style=none&taskId=u8029782b-bc3b-4b0c-be41-69af4053851&title=&width=1069)

### 分析请求的数据
通过响应信息，我们可以看到请求结果是一个html文本
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667709170489-22a5f42e-2d18-49f7-a0d5-7e66056ca3a1.png#averageHue=%23fcfbfb&clientId=u4b3c4be5-dd15-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=817&id=u12f0f7d0&margin=%5Bobject%20Object%5D&name=image.png&originHeight=817&originWidth=1396&originalType=binary&ratio=1&rotation=0&showTitle=false&size=85228&status=done&style=none&taskId=ub4973e21-97d2-4106-9e37-62c55cb3408&title=&width=1396)
可以看到数据都放在一个id为reportTable的表格里
通过解析html表格，就可以取到我们想要的数据

### 总结

1. 可得到核酸查询接口地址：[https://hsjc.gdwst.gov.cn/ncov-nat/nat/sample-detection-detail-query/personal-list-query](https://hsjc.gdwst.gov.cn/ncov-nat/nat/sample-detection-detail-query/personal-list-query)
2. 需要登录，可以获取到cookie的相关登录信息
3. 接口有跨域限制，只能通过非浏览器请求，获取数据
4. 接口返回的数据是html，需自己手动解析才能获取到想要的数据
## 搭建electron项目
了解了核酸查询接口的信息，我们就可以进入开发了，目标也很明确

1. 通过node发请求调用查询接口
2. 然后解析返回的结果，得到我们想要的数据
3. 再将结果通过我们自己的前端进行展示，也可以导出到excel中

### 搭建过程
搭建过程，不过多介绍，见这些文章

- [搭建Electron项目](https://www.yuque.com/alanlee97/bgg6o1/bqlfa2?view=doc_embed)
- [Electron集成React](https://www.yuque.com/alanlee97/bgg6o1/gp74iz?view=doc_embed)
### 目录结构
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667714048349-fbc183cd-6b28-4e6c-83a9-1ddb38900fdc.png#averageHue=%23252628&clientId=u1622fdfa-290b-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=513&id=ue0bcc90d&margin=%5Bobject%20Object%5D&name=image.png&originHeight=513&originWidth=336&originalType=binary&ratio=1&rotation=0&showTitle=false&size=20936&status=done&style=none&taskId=ub4d1340e-928b-4c06-a5aa-9e9fc9ed052&title=&width=336)


- electron入口
   - src/index.js
- 主进程代码
   - src/main/home
      - api/index.js
      - index.js
- 渲染进程代码(react)
   - src/renderer/home
   - index.js

完整代码见仓库：[https://github.com/AlanLee97/electron-detection-batch-query](https://github.com/AlanLee97/electron-detection-batch-query)

## 业务开发
### 编写electron入口代码
src/index.js
```javascript
const {mainHome} = require("./main/home"); // 引入主进程业务代码

const {app, BrowserWindow, Menu} = require('electron');
const path = require('path');

let win = null;
function createWindow(filePath = "./dist/index.html") {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // 预加载，将electron的API挂载window上
      preload: path.join(__dirname, './preload.js')
    }
  });

  win.loadURL(filePath);
}

app.whenReady().then(() => {
  mainHome.init(); // 引入主进程业务代码
  const path = (__dirname + '').replace('src', 'dist/index.html')
  createWindow(path);
  // 隐藏菜单栏
  Menu.setApplicationMenu(null)
})
```

### 主进程业务代码
注册ipcMain监听
```javascript
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
```

这里注册的监听代码，只要视图层发起ipc通信，就会触发这里的监听代码，然后调用node层相关的代码完成相关的逻辑。electron加载的时候通过preload.js定义的一些方法，暴露给前端的window，通过window可以调用相关的electron的相关api发送ipc消息
比如，通过视图层(react)视图中的【查询】按钮，视图层调用preload里定义的search方法，可以调用主进程中的node的代码，发起网络请求，前端通过回调函数拿到网络请求的数据。
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667723333622-ec71c74a-4d44-4563-aa6a-18ac9a421329.png#averageHue=%23fefdfd&clientId=u1622fdfa-290b-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=153&id=u4fcbd95f&margin=%5Bobject%20Object%5D&name=image.png&originHeight=153&originWidth=687&originalType=binary&ratio=1&rotation=0&showTitle=false&size=18036&status=done&style=none&taskId=u409b3e25-b893-4f5e-b25d-0bdac65b53d&title=&width=687)
前端发送ipc消息调用主进程代码
```javascript
const { electronAPI } = window
// 获取node查询的结果
const res = await electronAPI.search() || {}
```

preload.js
```javascript
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
```

为了好理解，我画了个图
![](https://cdn.nlark.com/yuque/0/2022/jpeg/743297/1667724354064-2fef5f4c-bf36-401f-af83-245a84a1c1ed.jpeg)

请求核酸查询接口
```javascript
// 批量查询
async function batchQuery() {
  try {
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
}

```

这里的逻辑主要如下

1. 读取excel的数据保存在state.excelData里，包含证件号idNumArr，手机号phoneArr的数据
2. 遍历idNumArr，通过search方法去请求核酸接口，拿到html字符串
3. 通过getTableStr方法，拿到table字符串
4. 判断table字符串中有无td元素
   1. 没有td，表示该证件号没有查到相关信息
      1. 再用对应的手机号查询是否有信息
         1. 没有信息，保存当前证件号和手机号
         2. 有结果，返回查询结果
   2. 有td，有查询到结果，将table字符串放进tableHTMLArr数组中
5. 遍历table字符串，解析出单元格数据，拼接表头数据和表的数据保存到excelArr中
6. 返回excel二维数组excelArr和未查询到的信息notResultArr

读取excel，保存excel这里就不介绍了

### 渲染进程业务代码
```jsx
import React from "react";
import { Button, Space, Table, message, Input } from 'antd';
import './style.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dataSource: [], // 表格数据源
      columns: [], // 表格表头
      excelData: { // 要导出的excel数据
        phoneArr: [],
        idNumArr: []
      },
      loadingTable: false, // table加载状态
      searchOk: false, // 查询是否成功
      // ...
    }
  }


  // ...

  // 查询
  query = async () => {
    try {
      const {excelData = {}} = this.state
      const {phoneArr = [], idNumArr = []} = excelData
      if(!(phoneArr.length > 0 || idNumArr.length > 0)) {
        message.warning('请先读取excel表数据，并且确保excel有数据');
        return
      }
      this.setState({
        loadingTable: true
      })
      const { electronAPI } = window
      // 获取node查询的结果
      const res = await electronAPI.search() || {}
      let {excelArr = [], notResultArr = []} = res

      notResultArr = notResultArr.map(item => {
        return {
          '证件号码': item[0],
          '电话号码': item[1]
        }
      })
  
      const head = excelArr.shift() || []
      const data = excelArr
  
      // 拼接表头信息
      let columns = head.map(item => {
        return {
          title: item,
          dataIndex: item,
          key: item,
        }
      })
  
      // 拼接数据源
      let dataSource = data.map((itemArr, i) => {
        const obj = {}
        itemArr.forEach((item, j) => {
          obj[head[j]] = item
          obj['key'] = i
        })
        return obj
      })

      // 去重
      let clearDuplicate = (arr, key) => Array.from(new Set(arr.map(e => e[key]))).map(e => arr.findIndex(x => x[key] == e)).map(e => arr[e])
      dataSource = clearDuplicate(dataSource, '证件号码')

      // filter column
      const filterArr = ['姓名', '证件号码', '电话号码', '采样时间', '检测时间', '检测结果']
      columns = columns.filter(item => filterArr.includes(item.title))

      // 筛选列数据
      dataSource = dataSource.map(item => {
        let obj = {}
        filterArr.forEach(key => {
          obj[key] = item[key]
        })
        return obj
      })
      this.setState({
        columns,
        dataSource,
        notResultArr
      }, () => {
        this.setState({
          loadingTable: false,
          searchOk: true
        })
      })
    } catch (error) {
      message.error('查询失败，请重试。Error：' + error)
      console.error(error)
      this.setState({
        loadingTable: false,
        searchOk: false
      })
    }
  }

  render() {
    const {dataSource, columns, excelData, loadingTable, searchOk, updateCookie, notResultArr, notResultArrHead} = this.state

    return <div className="page">
      // ...
      
      {
        <Table loading={loadingTable} dataSource={dataSource} columns={columns} scroll={{ x: 'max-content' }} 
        pagination={
          {
            total: dataSource.length,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSize: 10,
            showTotal: total => `总共 ${total} 条`
          }
        } />
      }

      // ...
      
    </div>
  }
}

export default App;
```
这个query函数的业务逻辑主要如下：

1. 发送ipc消息给主进程，通知主进程发起请求获取数据，并传回处理好的数据
2. 拼接好antd的Table组件需要的数据格式
3. 数据去重，因为这个接口可以查出一个人好几天的核酸信息，会有多条数据，所以去重，留着最新的数据
4. 筛选列数据，因为接口中查询出来有些数据我们不关心，所以只筛选我们感兴趣的列数据
5. 将处理好的数据保存打到state中，表格展示数据

![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667705607025-1eb80c9f-3060-4824-9422-a9f4e7a23e53.png#averageHue=%23fdfdfc&clientId=u4b3c4be5-dd15-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=1039&id=mu9Xf&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1039&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&size=125728&status=done&style=none&taskId=u5fdd195e-18bd-4511-bfcb-7317cbba272&title=&width=1920)

### 打包electron应用
开发过程中，可以执行`npm start`进行开发调试
业务开发完成，打包electron应用，执行`npm run package`
打包成功后，会在当前项目中生成一个out文件夹
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667739240993-0b7f7aa1-0ce1-4210-8413-487faa06ca3a.png#averageHue=%23fdfbfb&clientId=u96087a9a-9d4e-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=396&id=ua892c4aa&margin=%5Bobject%20Object%5D&name=image.png&originHeight=396&originWidth=958&originalType=binary&ratio=1&rotation=0&showTitle=false&size=22869&status=done&style=none&taskId=ue2765c6f-765f-4f5d-bed2-cf1c8fb5017&title=&width=958)
里面有我们打包好的应用，进入文件夹，找到electron.exe的文件，双击执行即可
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667739769910-caa474c9-4784-4f78-a593-bc51e3166758.png#averageHue=%23f9f6f5&clientId=u96087a9a-9d4e-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=628&id=ud673b662&margin=%5Bobject%20Object%5D&name=image.png&originHeight=628&originWidth=1123&originalType=binary&ratio=1&rotation=0&showTitle=false&size=114312&status=done&style=none&taskId=u296c04c1-b2ee-4d82-9783-6e9696e443c&title=&width=1123)
## 界面展示
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667705607025-1eb80c9f-3060-4824-9422-a9f4e7a23e53.png#averageHue=%23fdfdfc&clientId=u4b3c4be5-dd15-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=1039&id=u91334281&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1039&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&size=125728&status=done&style=none&taskId=u5fdd195e-18bd-4511-bfcb-7317cbba272&title=&width=1920)
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667724972570-3d2f94be-d3d2-4b7d-a8d1-b67fed7dd283.png#averageHue=%23fefefe&clientId=u1622fdfa-290b-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=748&id=u7de627b6&margin=%5Bobject%20Object%5D&name=image.png&originHeight=748&originWidth=1258&originalType=binary&ratio=1&rotation=0&showTitle=false&size=97025&status=done&style=none&taskId=u85803713-8742-4af7-9994-11e4012b8c7&title=&width=1258)
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667725028489-bad0ec2d-5fe5-44ca-a8a2-d7596c2842f0.png#averageHue=%23fdfdfd&clientId=u1622fdfa-290b-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=748&id=u68bd8cee&margin=%5Bobject%20Object%5D&name=image.png&originHeight=748&originWidth=1258&originalType=binary&ratio=1&rotation=0&showTitle=false&size=71073&status=done&style=none&taskId=ub9325fd8-1321-4108-9e4c-82f8f9365c7&title=&width=1258)

### 动图演示
![演示.gif](https://cdn.nlark.com/yuque/0/2022/gif/743297/1667728035908-e0aee6db-9ef9-4f94-a122-27f8b14fa061.gif#averageHue=%23e5c48e&clientId=u1622fdfa-290b-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=752&id=u4be41ebb&margin=%5Bobject%20Object%5D&name=%E6%BC%94%E7%A4%BA.gif&originHeight=752&originWidth=1250&originalType=binary&ratio=1&rotation=0&showTitle=false&size=5018462&status=done&style=none&taskId=u7b1c4ea0-6616-4d56-bc62-2b169ad8760&title=&width=1250)

## 待优化的地方

1. 打包出来后的体积太大了

exe文件130多M
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667739948378-7b042fe8-1851-43f0-ab72-83c5189998f4.png#averageHue=%23fcf8f7&clientId=u96087a9a-9d4e-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=509&id=u2ee4a814&margin=%5Bobject%20Object%5D&name=image.png&originHeight=509&originWidth=873&originalType=binary&ratio=1&rotation=0&showTitle=false&size=59316&status=done&style=none&taskId=u1c1ff9c9-eb5a-44a9-86af-f0bbd0736f4&title=&width=873)
压缩文件夹之后也还有120M
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667739913309-c1a8ab3a-52a2-40db-b225-2a01c4a7f09c.png#averageHue=%23fdfcfb&clientId=u96087a9a-9d4e-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=132&id=u839b63ed&margin=%5Bobject%20Object%5D&name=image.png&originHeight=132&originWidth=828&originalType=binary&ratio=1&rotation=0&showTitle=false&size=10386&status=done&style=none&taskId=u319ce735-e1a8-45f5-abc7-e4f0ec50636&title=&width=828)

## 后记
过了一周，我问了下我那个同学，软件用得怎么样，有没有什么地方需要改进的
他说用得挺好的，他那边的疫情也稳定了。
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667741064936-78f068e7-f223-478a-8676-b997d5352ade.png#averageHue=%23f2f2f0&clientId=u2a96082b-46a2-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=914&id=uffe1dc72&margin=%5Bobject%20Object%5D&name=image.png&originHeight=914&originWidth=608&originalType=binary&ratio=1&rotation=0&showTitle=false&size=93083&status=done&style=none&taskId=u50d5b4da-1e85-4054-bc3b-35e0b65b3ee&title=&width=608)
![image.png](https://cdn.nlark.com/yuque/0/2022/png/743297/1667741079754-91f62f42-61b1-4bab-a06e-e5c2985d59da.png#averageHue=%23f3f2ef&clientId=u2a96082b-46a2-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=521&id=u3bff6779&margin=%5Bobject%20Object%5D&name=image.png&originHeight=521&originWidth=606&originalType=binary&ratio=1&rotation=0&showTitle=false&size=59178&status=done&style=none&taskId=u0d621624-e37b-423b-98e9-eaa449f9024&title=&width=606)

其实，这也是我第一次完整的开发了一个electron项目，之前在上一家公司写过electron的项目，但没完全自己从0到1做完一个项目，虽然这个项目挺简单的，也算是一个练手的好项目了。最后能为防疫工作出一点自己的力，也算是一种不错的体验了。

有感兴趣的朋友可以在这里看源码：
[https://github.com/AlanLee97/electron-detection-batch-query](https://github.com/AlanLee97/electron-detection-batch-query)
