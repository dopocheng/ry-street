import axios from "./index.js";

export function contrastApi(data) {//originalDcl/indexContrastStreet 街景索引对比
    return axios({
        url: '/originalDcl/indexContrastStreet',
        method: 'get',
        params: data
    })
}

export function streetDownApi(data) {//streetDown/streetDownByTableName 街景下载(前端调用)
    return axios({
        url: '/streetDown/streetDownByTableName',
        method:'post',
        params: data
    })
}