
async function search(params = {}) {
  return new Promise((resolve, reject) => {
    var axios = require('axios');
    var qs = require('qs');
    var data = qs.stringify({
    'selectScope': '2',
    'sampleBarcode': '',
    'personName': '',
    'identityNumber': params.identityNumber,
    'phoneNumber': params.phoneNumber,
    'sampleDateBegin': '',
    'sampleDateEnd': '',
    'detectionDateBegin': '',
    'detectionDateEnd': '' 
    });
    var config = {
      method: 'post',
      url: 'https://hsjc.gdwst.gov.cn/ncov-nat/nat/sample-detection-detail-query/personal-list-query',
      headers: { 
        'Connection': 'keep-alive', 
        'Cache-Control': 'max-age=0', 
        'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"', 
        'sec-ch-ua-mobile': '?0', 
        'Upgrade-Insecure-Requests': '1', 
        'Origin': 'https://hsjc.gdwst.gov.cn', 
        'Content-Type': 'application/x-www-form-urlencoded', 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36', 
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9', 
        'Sec-Fetch-Site': 'same-origin', 
        'Sec-Fetch-Mode': 'navigate', 
        'Sec-Fetch-User': '?1', 
        'Sec-Fetch-Dest': 'iframe', 
        'Referer': 'https://hsjc.gdwst.gov.cn/ncov-nat/nat/sample-detection-detail-query/personal-list', 
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8', 
        'Cookie': params.loginCookie
      },
      data : data
    };

    axios(config)
    .then(function (response) {
      resolve(response.data.toString())
    })
    .catch(function (error) {
      console.log(error);
      reject(error)
    });
  })
}

module.exports = {
  search
}