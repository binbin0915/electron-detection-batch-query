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
      updateCookie: false, // 收是否显示更新cookie的输入框
      cookie: '', // 输入时保存输入的cookie
      loginCookie: '', // 保存输入的cookie
      notResultArr: [], // 未查询到核酸的信息
      notResultArrHead: [ // 未查询到核酸的表头信息
        {
          title: '证件号码',
          dataIndex: '证件号码',
          key: '证件号码',
        }, 
        {
          title: '电话号码',
          dataIndex: '电话号码',
          key: '电话号码',
        }
      ]
    }
  }

  componentDidMount() {
    // 恢复cookie
    this.recoverCookie()
  }

  // 恢复cookie
  recoverCookie = () => {
    const loginCookie = localStorage.getItem('loginCookie');
    if(loginCookie) {
      this.setState({
        cookie: loginCookie,
        loginCookie
      }, () => {
        localStorage.setItem('loginCookie', this.state.loginCookie)
      })
    }
    const { electronAPI } = window
    electronAPI.updateCookie(loginCookie)
  }

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

  // 读取excel
  readExcel = async () => {
    const { electronAPI } = window
    const res = await electronAPI.readExcel()
    this.setState({
      excelData: res
    })
  }

  // 导出excel
  exportExcel = async () => {
    const {columns, dataSource} = this.state
    let head = []
    columns.forEach(item => {
      head.push(item.title)
    })
    const excelArr = [head]
    dataSource.forEach(item => {
      let data = []
      for (const key in item) {
        data.push(item[key])
      }
      excelArr.push(data)
    })

    const { electronAPI } = window
    const res = await electronAPI.exportExcel(excelArr).then(res => {
      message.success('导出成功，请在电脑桌面查看【查询结果.xlsx】文件')
    }).catch(err => {
      message.error('导出失败。' + err)
    })
  }

  // 切换显示cookie输入框
  toggleCookieBox = () => {
    this.setState({
      updateCookie: !this.state.updateCookie
    })
  }

  // 保存cookie
  saveCookie = () => {
    if(this.state.cookie.length === 0) {
      message.warning('请输入cookie')
      return
    }
    this.setState({
      loginCookie: this.state.cookie
    }, () => {
      const { electronAPI } = window
      electronAPI.updateCookie(this.state.loginCookie)
      localStorage.setItem('loginCookie', this.state.loginCookie)
      message.success('cookie更新成功')
      setTimeout(() => {
        this.toggleCookieBox()
      }, 500)
    })
  }

  onInput = e => {
    this.setState({
      cookie: e.target.value
    })
  }

  render() {
    const {dataSource, columns, excelData, loadingTable, searchOk, updateCookie, notResultArr, notResultArrHead} = this.state

    return <div className="page">
      <div className="title-bar">
        <h1>核酸一键批量查询</h1>
        <Button type="link" onClick={this.toggleCookieBox}>更新Cookie</Button>
      </div>
      <div style={updateCookie ? {} : {display: 'none'}} className="cookie-input-bar-wrapper">
        <div>当登录信息过期时，需输入新的cookie</div>
        <div className="cookie-input-bar">
        <Input
          style={{width: '70%', marginRight: '10px'}}
          value={this.state.cookie}
          placeholder="输入最新的cookie"
          size="large"
          onInput={this.onInput}
        />
        <Button size="large" onClick={this.saveCookie}>保存</Button>
        </div>
      </div>
      <div className="btn-area">
        <div className="btn-area-bar">
          <Space>
            <Button type='primary' onClick={this.query}>查询</Button>
            <Button type='primary' onClick={this.readExcel}>读取excel</Button>
          </Space>
          {searchOk && <Button onClick={this.exportExcel}>导出结果</Button>}
        </div>
      </div>

      <div className="excel-info">
        {
          excelData.phoneArr.length > 0 &&
          <div>读取手机号码数量：{excelData.phoneArr.length}</div>
        }

        {
          excelData.idNumArr.length > 0 &&
          <div>读取证件号码数量：{excelData.idNumArr.length}</div>
        }
      </div>

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


      {
        notResultArr.length > 0 &&
        <div style={{margin: '20px 0'}}>
          <h2>以下人员信息未查询到结果，请手动查询确认</h2>
        </div>
      }
      {
        notResultArr.length > 0 &&
        <Table dataSource={notResultArr} columns={notResultArrHead}
        pagination={
          {
            total: notResultArr.length,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSize: 10,
            showTotal: total => `总共 ${total} 条`
          }
        } />
      }
      
    </div>
  }
}

export default App;