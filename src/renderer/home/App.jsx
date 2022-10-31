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
      loginCookie: ''
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
      const res = await electronAPI.search() || []
      console.log('batch query res', res)
  
      // const {head = [], data = []} = res
      const head = res.shift() || []
      const data = res
  
      console.log('batch query split', {head, data})
  
      let columns = head.map(item => {
        return {
          title: item,
          dataIndex: item,
          key: item,
        }
      })
  
      const dataSource = data.map((itemArr, i) => {
        const obj = {}
        itemArr.forEach((item, j) => {
          obj[head[j]] = item
          obj['key'] = i
        })
        return obj
      })

      // filter column
      const filterArr = ['姓名', '证件号码', '电话号码', '采样时间', '检测时间', '检测结果']

      columns = columns.filter(item => filterArr.includes(item.title))
  
      console.log({columns, dataSource})
      this.setState({
        columns,
        dataSource
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
    const { electronAPI } = window
    const res = await electronAPI.exportExcel()
    console.log('exportExcel res', res)
    if(res === 1) {
      message.success('导出成功，请在电脑桌面查看【查询结果.xlsx】文件')
    }else {
      message.error('导出失败')
    }
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
    const {dataSource, columns, excelData, loadingTable, searchOk, updateCookie} = this.state
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
      
    </div>
  }
}

export default App;