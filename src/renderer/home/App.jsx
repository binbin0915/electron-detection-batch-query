import React from "react";
import { Button, Space, Table, message, Input } from 'antd';
import './style.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      msg: '',
      count: 0,
      dataSource: [],
      columns: [],
      excelData: {
        phoneArr: [],
        idNumArr: []
      },
      loadingTable: false,
      searchOk: false,
      test: '',
      updateCookie: false,
      cookie: '',
      loginCookie: '',
      notResultArr: [],
      notResultArrHead: [
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
      // this.query()
      const loginCookie = localStorage.getItem('loginCookie');
      console.log('componentDidMount============================================>')
      console.log('loginCookie', loginCookie)
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
      const res = await electronAPI.search() || {}
      let {excelArr = [], notResultArr = []} = res
      console.log('batch query res', res)

      notResultArr = notResultArr.map(item => {
        return {
          '证件号码': item[0],
          '电话号码': item[1]
        }
      })
  
      // const {head = [], data = []} = res
      const head = excelArr.shift() || []
      const data = excelArr
  
      console.log('batch query split', {head, data})
  
      let columns = head.map(item => {
        return {
          title: item,
          dataIndex: item,
          key: item,
        }
      })
  
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
  
      console.log({columns, dataSource})
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

  readExcel = async () => {
    console.log('readExcel')
    const { electronAPI } = window
    const res = await electronAPI.readExcel()
    console.log('readExcel', res)
    this.setState({
      excelData: res
    })
  }

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
    console.log('excelArr', excelArr)
    const { electronAPI } = window
    const res = await electronAPI.exportExcel(excelArr).then(res => {
      message.success('导出成功，请在电脑桌面查看【查询结果.xlsx】文件')
    }).catch(err => {
      message.error('导出失败。' + err)
    })
  }

  toggleCookieBox = () => {
    this.setState({
      updateCookie: !this.state.updateCookie
    })
  }

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
    console.log('onInput', e);
    this.setState({
      cookie: e.target.value
    })
  }

  render() {
    const {dataSource, columns, excelData, loadingTable, searchOk, updateCookie, notResultArr, notResultArrHead} = this.state
    console.log('render', {columns, dataSource})
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