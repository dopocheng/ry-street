//indexDownAPI j接口
import axios from "./index.js";

export function getONe(query) {
    return axios({
        url: 'get/1',
        method: 'get',
        params: query
    })
}
export function postONe() {

}
//key下载
export function indexDownApi(data) {//originalDcl/indexDown  范围下载街景索引
    return axios({
        url: '/originalDcl/indexDown',
        method: 'post',
        data: data
    })
}

export function getAlreadAPI() {//待处理索引 count
    return axios({
        url: '/rabbitmqAcquire/queue_original_dcl',
        method: 'get'
    })
}

export function getIndexApi() {//未下载索引
    return axios({
        url: '/rabbitmqAcquire/queue_index',
        method: 'get',
    })
}
/**
 * 查询区域中裤（未保存没ID）
 * @data {*} points 
 */
export function panoKeyApi(data) {//添加索引
    return axios({
        url: '/originalDcl/downRegion',
        method: 'post',
        data: data
    })
}