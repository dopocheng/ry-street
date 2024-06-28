import axios from "./index.js";

export function currentAreaApi(data) {//originalDcl/getTableByRegion 区域框选查询区域内的库
    return axios({
        url: '/originalDcl/getTableByRegion',
        method: 'post',
        data: data
    })
}

export function diskLetterApi(data) {//originalDcl/listRoot 获取盘符
    return axios({
        url: '/originalDcl/listRoot',
        method: 'post',
        params: data
    })
}

export function areaCopyApi(data) {//originalDcl/streetCopy 街景拷贝
    return axios({
        url: '/originalDcl/streetCopy',
        method: 'post',
        params: data
    })
}



export function dataCopyApi(data) {//originalDcl/streetIndexCopy
    return axios({
        url: '/originalDcl/streetIndexCopy',
        method: 'post',
        params: data
    })
}

export function dbIdApi(params) {//originalDcl/getStreetTableRegionByRegion
    console.log(22)
    return axios({
        url: "/originalDcl/getStreetTableRegionByRegion",
        method: 'get',
        params: params
    })
}
