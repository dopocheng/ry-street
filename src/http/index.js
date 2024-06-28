import axios from 'axios'
const instance = axios.create({
  // baseURL: 'http://192.168.1.45:8089',
  // baseURL: 'http://localhost:8089',
  baseURL: 'http://192.168.1.188:8089',
  timeout: 10000,
  headers: {
    'content-Type': 'application/json;charset=UTF-8',//设置默认请求头
    'Accept': 'application/json'
  }
})

instance.defaults.paramsSerializer = (params) => {//get 请求中特殊字符[]无法编译
  return Object.keys(params).filter(it => {
    return params.hasOwnProperty(it)
  }).reduce((pre, curr) => {
    return params[curr] ? (pre ? pre + '&' : '') + curr + '=' + encodeURIComponent(params[curr]) : pre;
  }, '');
}

// instance.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8';//单独配置请求头 headers 里就不要配置了

// 添加请求拦截器（如果需要）
// instance.interceptors.request.use(config => {
//     // 在发送请求之前，可以在这里添加授权令牌
//     const token = localStorage.getItem('token'); // 假设你将 token 存储在 localStorage 中
//     if (token) {
//         config.headers['Authorization'] = `Bearer ${token}`;
//     }
//     return config;
// }, error => {
//     // 对请求错误做些什么
//     return Promise.reject(error);
// });

// // 添加响应拦截器（如果需要）
// instance.interceptors.response.use(response => {
//     // 对响应数据做些什么
//     return response;
// }, error => {
//     // 对响应错误做些什么
//     return Promise.reject(error);
// });

export default instance;