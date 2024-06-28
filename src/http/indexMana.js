import axios from "./index.js";



export function deletePointsApi(data) {//originalDcl/deleteIndexByKeyName 根据KeyName删除点
    return axios({
        url: '/originalDcl/deleteIndexByKeyNameAll',
        method: 'post',
        data: data
    })
}
export function deleteOneApi(data) {//originalDcl/deleteIndexByKeyName 根据KeyName删除点
    return axios({
        url: '/originalDcl/deleteIndexByKeyName',
        method: 'post',
        data: data
    })
}
export function deleteAreaApi(data) {//originalDcl/deleteIndexByRegion 根据区域删除索引点
    return axios({
        url: '/originalDcl/deleteIndexByRegion',
        method: 'post',
        data: data
    })
}

export function streetQueue(params) {//rabbitmqAcquire/queue_original_lon_lat 街景下载队列数量
    return axios({
        url: "/rabbitmqAcquire/queue_original_lon_lat",
        method: 'get',
        params: params
    })
}

export function streetDownApi(data) {//streetDown/streetDownByTableName 街景下载(前端调用)
    return axios({
        url: '/streetDown/streetDownByTableName',
        method: 'post',
        params: data
    })
}

export function notDownApi() {//street_index/getStreetNotDownload 获取未下载的街景TableName
    return axios({
        url: `/street_index/getStreetNotDownload`,
        method: 'get'
    })
}

//originalDcl/getBigRegion 大小区域框选筛选
export function kuShaixuan(data) {///originalDcl/{ids}
    return axios({
        url: `/originalDcl/getBigRegion`,
        method: 'post',
        params: data
    })
}
export function areaAll(params) {
    return axios({
        url: "/originalDcl/getRegionAll",
        method: 'get',
        params: params
    })
}
export function areaDb(params) {
    return axios({
        url: "/originalDcl/getStreetTableRegionByRegion",
        method: 'get',
        params: params
    })
}


//yong  /originalDcl/deleteIndexDesignate 根据指定年份删除库中索引
export function yearDeleteApi(data) {///originalDcl/{ids}
    return axios({
        url: '/originalDcl/deleteIndexDesignate',
        method: 'post',
        data: data
    })
}


export function dataCopyApi(data) {///originalDcl/{ids}
    console.log('44555', data)
    return axios({
        url: '/originalDcl/streetIndexCopy',
        method: 'post',
        params: data
    })
}
export function deleteApi(data) {///originalDcl/{ids}
    return axios({
        url: `/originalDcl/deleteById`,
        method: 'post',
        data: data
    })
}
export function yearApi(data) {//1平方公里库范围街景点
    return axios({
        url: '/originalDcl/getStreetYear',
        method: 'post',
        data: data
    })
}
export function streetApi(data) {//1平方公里库范围街景点 getStreetIndexAll
    return axios({
        url: '/originalDcl/getStreetIndexAll',
        method: 'post',
        data: data
    })
}
